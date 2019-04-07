((cxl, db) => {
"use strict";
const
	rx = cxl.rx,
	fb = cxl.fb,
	CollectionEvent = rx.CollectionEvent,
	Observable = rx.Observable
;

class Snapshot
{
	constructor(snap)
	{
		this.$snap = snap;
		this.key = snap.key;
	}

	get value() { return this.$snap.val(); }
	get length() { return this.$snap.numChildren(); }
	get exists() { return this.$snap.exists(); }
}

function $reference(path)
{
	return fb.database.ref(path);
}

function defineProperty(entity, name, ref, Type)
{
	let instance;

	Object.defineProperty(entity, name, {
		get() { return instance || (instance = new Type(ref.child(name))); }
	});
}

function field(Type)
{
	return class extends Entity {
		 $snap(snap) { return new Type(snap.val()); }
	};
}

function defineFunction(entity, name, ref, formula)
{
	let instance;

	Object.defineProperty(entity, name, {
		get() { return instance || (instance = formula.create(ref, name)); }
	});
}

function applySchema(entity, ref, schema)
{
	for (let i in schema)
	{
		let Type = schema[i];

		if (Array.isArray(Type))
			defineProperty(entity, i, ref, Type.length ? Collection.of(Type[0]) : Collection);
		else if (Type.prototype instanceof Observable)
			defineProperty(entity, i, ref, Type);
		else if (Type instanceof Formula)
			defineFunction(entity, i, ref, Type);
		else
			defineProperty(entity, i, ref, field(Type));
	}
}

function getReference(ref)
{
	if (typeof(ref)==='string')
		return $reference(ref);
	if (ref instanceof Entity || ref instanceof Collection)
		return $reference(ref.$ref);

	return ref;
}

class Entity extends Observable
{
	static schema()
	{
	}

	static link(newPath)
	{
		return class extends this {
			constructor(path)
			{
				// TODO check types?
				super(newPath + '/' + path.parent.key);
			}
		};
	}

	constructor(path)
	{
		super(subscriber => {
			const ref = this.$ref, onValue = snap => subscriber.next(this.$snap(snap));
			ref.on('value', onValue);
			return ref.off.bind(ref, 'value', onValue);
		});

	const
		ref = this.$ref = getReference(path),
		schema = this.constructor.schema()
	;
		if (schema)
			applySchema(this, ref, schema);
	}

	$snap(snap)
	{
		return snap.val();
	}

	set(val) { return this.$ref.set(val).then(() => this); }

	get key()
	{
		return this.$ref.key;
	}
}

class Collection extends Observable
{
	static of(EntityType)
	{
		return class extends this {
			get Entity() { return EntityType; }
		};
	}

	static map(path)
	{
		return class extends this {
			constructor(ref)
			{
				super(ref);
				this.$oldRef = this.$ref;
				this.$ref = $reference(path);
			}

			pushMap(newRef, meta)
			{
				this.$oldRef.child(newRef.key).set(meta===null || meta===undefined ? true : meta);
				return newRef;
			}

			push(value, meta)
			{
				return super.push(value).then(newRef => this.pushMap(newRef, meta));
			}
		};
	}

	constructor(path)
	{
		super(subscriber => {
			subscriber.next(new CollectionEvent(this, 'empty'));
			ref.on('child_added', this.$onSnapshot.bind(this, 'added', subscriber));
			ref.on('child_removed', this.$onSnapshot.bind(this, 'removed', subscriber));
			ref.limitToFirst(1).once('value', this.$onSnapshot.bind(this, 'meta', subscriber));

			return ref.off.bind(ref);
		});

		const ref = this.$ref = getReference(path);
	}

	get Entity() { return Entity; }

	$onSnapshot(type, subscriber, snap)
	{
		const item = (type==='added' || type==='removed') ? this.child(snap.key) : new Snapshot(snap);

		subscriber.next(new CollectionEvent(this, type, item));
	}

	child(key)
	{
		return new this.Entity(this.$ref.child(key));
	}

	push(value)
	{
		if (value===undefined || value===null)
			throw new Error("value is required");

		return this.$ref.push(value).then(ref => this.child(ref.key));
	}

	/*where(field, value)
	{
		this.$ref  = this.$ref.orderByChild(field).equalTo(value);
		return this;
	}*/
}

class Query extends Observable
{
	constructor(path)
	{
		super(subscriber => {
			const ref = this.$ref;
			ref.on('value', this.$onSnapshot.bind(this, subscriber));
			return ref.off.bind(ref);
		});

		this.$ref = getReference(path);
	}

	$onSnapshot(subscriber, snap)
	{
		subscriber.next(new Snapshot(snap));
	}

	where(field, value)
	{
		this.$ref  = this.$ref.orderByChild(field).equalTo(value);
		return this;
	}

	value()
	{
		return this.then(snap => snap.value);
	}

	first()
	{
		return this.then(snap => snap.value && Object.values(snap.value)[0]);
	}

	firstKey()
	{
		return this.then(snap => snap.value && Object.keys(snap.value)[0]);
	}

	then(resolve, fail)
	{
		return rx.toPromise(this).then(resolve, fail);
	}
}

class Formula
{
	constructor(fn)
	{
		this.fn = fn;
	}

	create(ref, fieldName)
	{
		return this.fn(ref, fieldName);
	}
}

cxl.db = Object.assign(db, {

	Entity: Entity,
	Collection: Collection,

	formula(fn)
	{
		return new Formula(fn);
	},

	select(entity)
	{
		return new Query(entity);
	},

	entity(def, proto)
	{
		class Result extends Entity {
			static schema() { return def; }
		}

		cxl.extend(Result.prototype, proto);

		return Result;
	}
});

})(this.cxl || global.cxl, this.cxl ? {} : module.exports);
