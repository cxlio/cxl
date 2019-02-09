((cxl, firebase) => {
"use strict";

const
	fb = cxl.fb = function(path) {
		return new fb.Reference(path);
	},
	map = cxl.rx.operators.map,
	directive = cxl.directive
;

function getPath(path, state)
{
	return cxl.replaceParameters(path, state);
}

class Snapshot
{
	constructor(snap)
	{
		this.$snap = snap;
		this.key = snap.key;
	}

	get reference()
	{
		return this.$ref || (this.$ref = new FireReference(this.$snap.ref));
	}

	get value()
	{
		return this.$value===undefined ? (this.$value = this.$snap.val()) : this.$value;
	}

	get length() { return this.$snap.numChildren(); }
	get exists() { return this.$snap.exists(); }
}

function defineSchema(model, prop, def)
{
	const $ref = model.reference;

	if (!(def instanceof cxl.rx.Observable))
		def = $ref.reference(def.name || prop);

	return def;
}

function normalizeEntity(def)
{
	const schema = def.schema;

	if (typeof(def.schema) !== 'function')
		def.schema = () => schema;

	return def;
}

function getReference(path, key)
{
	const parent = fb(path);

	return (key===undefined || key===null) ? parent.push() : parent.reference(key);
}

function applySchema(entity, schema)
{
	const ref = entity.reference.$ref;

	for (let i in schema)
	{
		const Field = schema[i];
		entity[i] = new Field(ref.child(i)); //defineSchema(this, i, schema[i]);
	}
}

class Entity
{
	static create(data)
	{
		return new Promise(resolve => {
			const result = new this();
			result.reference.set(data);
			resolve(result);
		});
	}

	get key()
	{
		return this.reference.key;
	}

	constructor(key)
	{
	const
		def = normalizeEntity(this.constructor.define()),
		reference = getReference(def.path, key),
		schema = def.schema(reference)
	;
		Object.defineProperty(this, 'reference', {
			value: reference,
			enumerable: false
		});

		applySchema(this, schema);
	}
}

/**
 * A FireModel helps build and validate Firebase data models
 */
class FireModel
{
	/**
	 * @param refPath {FireReference|string} A reference or a path to a reference.
	 * @param schema {Object|Function(ref)} Object or function that defines the schema
	 */
	constructor(refPath, schema)
	{
		this.reference = refPath instanceof fb.Reference ? refPath : cxl.fb(refPath);

		const props = typeof(schema)==='function' ? schema(this.reference) : schema;

		for (var i in props)
			this[i] = defineSchema(this, i, props[i]);
	}

}

class FireMeta extends cxl.rx.Observable
{
	constructor(ref)
	{
		ref = ref.limitToFirst(0);

		super(subscriber => {
			function onValue(snap)
			{
				subscriber.next(new Snapshot(snap));
				subscriber.complete();
			}

			ref.once('value', onValue);

			return () => ref.off('value', onValue);
		});
	}
}

class FireReference extends cxl.rx.Observable
{
	constructor(path)
	{
		super();
		this.$ref = (!path || typeof(path)==='string') ? cxl.fb.database.ref(path) : path;
	}

	$onValue(snap)
	{
		this.next(snap.val());
	}

	__subscribe(subscriber)
	{
		const onValue = this.$onValue.bind(subscriber);
		this.$ref.on('value', onValue);
		return this.$ref.off.bind(this.$ref, 'value', onValue);
	}

	/**
	 * Generates a new Reference from a firebase reference
	 */
	query(fn)
	{
		const ref = fn(this.$ref);
		return new this.constructor(ref);
	}

	get key() { return this.$ref.key; }
	get path() { return this.$ref.path.toString(); }

	set(value) { return this.$ref.set(value); }

	push(value)
	{
		const ref = this.$ref.push(value);
		return new FireReference(ref);
	}

	get parent() { return new FireReference(this.$ref.parent); }

	reference(path)
	{
		return new FireReference(this.$ref.child(path));
	}

	collection(path)
	{
		return new fb.Collection(this.$ref.child(path));
	}

	meta()
	{
		return new FireMeta(this.$ref);
	}

	// TODO should this be complete()
	destroy()
	{
		this.$ref.off();
	}
}

class FireCollection extends FireReference
{
	static of(EntityClass)
	{
		const collection = class extends FireCollection {};
		collection.prototype.$getItem = function(snap) { return new EntityClass(snap.value); };
		return collection;
	}

	constructor(pathOrRef)
	{
		super();
		this.$ref = typeof(pathOrRef)==='string' ? fb.database.ref(pathOrRef) : pathOrRef;
	}

	__subscribe(subscriber)
	{
		subscriber.next(new cxl.rx.CollectionEvent(this, 'empty'));
		this.$ref.on('child_added', this.$onSnapshot.bind(this, 'added', subscriber));
		this.$ref.on('child_removed', this.$onSnapshot.bind(this, 'removed', subscriber));
		this.$ref.limitToFirst(1).once('value', this.$onSnapshot.bind(this, 'meta', subscriber));

		return this.destroy.bind(this);
	}

	$getItem(snap)
	{
		return snap;
	}

	$onSnapshot(type, subscriber, snap)
	{
		let item = new Snapshot(snap);

		if (type==='added' || type==='removed')
			item = this.$getItem(item);

		subscriber.next(new cxl.rx.CollectionEvent(this, type, item));
	}
}

directive('fb', {

	connect(state)
	{
		const path = getPath(this.parameter, state);

		this.bindings = [ this.fb = new FireReference(path, state.$fb) ];
	},

	update(url)
	{
		if (!this.fb)
			this.connect(this.owner.state);

		this.fb.path = url;
		return this.fb;
	},

	digest()
	{
		return this.fb || this.value;
	}

});

directive('fb.user', {

	initialize()
	{
		this.bindings = [
			{ destroy: firebase.auth().onAuthStateChanged(this.owner.digest.bind(this.owner)) }
		];
	},

	digest()
	{
		return firebase.auth().currentUser;
	}

});

Object.assign(fb, {

	Collection: FireCollection,
	Reference: FireReference,
	Model: FireModel,

	Entity: Entity,

	database: null,
	started: false,

	operators: {
		constructEvent(Constructor, field, extraArg)
		{
			return map(ev => {
				if (ev.type==='added' || ev.type==='removed')
					ev.value = new Constructor(field ? ev.value[field] : ev.value, extraArg);
				return ev;
			});
		}
	},

	start(config)
	{
		if (fb.started)
			throw new Error("fb module already started");

		firebase.initializeApp(config);

		fb.started = true;
		fb.database = firebase.database();
		fb.auth = firebase.auth();
	}

});

})(this.cxl, this.firebase);