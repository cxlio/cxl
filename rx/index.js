(rx => {

class Subscriber {

	constructor(observer, error, complete, unsubscribe)
	{
		if (observer && typeof(observer)!=='function')
		{
			error = observer.error;
			complete = observer.complete;
			observer = observer.next;
		}

		this.isUnsubscribed = false;
		this.__next = observer;
		this.__error = error;
		this.__complete = complete;
		this.__unsubscribe = unsubscribe;
	}

	next(val)
	{
		try {
			if (!this.isUnsubscribed && this.__next)
				this.__next.call(this, val);
		} catch (e)
		{
			this.error(e);
		}
	}

	error(e)
	{
		if (!this.isUnsubscribed && this.__error)
			this.__error.call(this, e);
		this.unsubscribe();
	}

	complete()
	{
		if (!this.isUnsubscribed && this.__complete)
			this.__complete();
		this.unsubscribe();
	}

	unsubscribe()
	{
		this.isUnsubscribed = true;
		if (this.__unsubscribe) this.__unsubscribe();
	}

}

class Observable {

	static create(A, B, C)
	{
		return new this(A, B, C);
	}

	constructor(subscribe)
	{
		if (subscribe)
			this.__subscribe = subscribe;
	}

	pipe(operator)
	{
		return operator(this);
	}

	toPromise()
	{
		return new Promise((resolve, reject) =>
		{
			this.subscribe(function(val) {
				this.unsubscribe();
				resolve(val);
			}, e => setTimeout(reject.bind(this, e)));
		});
	}

	subscribe(observer, error, complete)
	{
		const subscriber = new Subscriber(observer, error, complete);

		subscriber.__unsubscribe = this.__subscribe(subscriber);

		return subscriber;
	}

}

class Subject extends Observable {

	constructor()
	{
		super(subscriber => {
			subscribers.add(subscriber);

			if (this.onSubscribe)
				this.onSubscribe(subscriber);

			return subscribers.delete.bind(subscribers, subscriber);
		});

		const subscribers = this.observers = new Set();
	}

	next(a)	{ this.observers.forEach(s => s.next(a)); }
	error(e) { this.observers.forEach(s => s.error(e)); }
	complete() { this.observers.forEach(s => s.complete()); }

}

class BehaviorSubject extends Subject {

	constructor(val)
	{
		super();
		this.value = val;
	}

	onSubscribe(subscriber)
	{
		if (this.value!==undefined)
			subscriber.next(this.value);
	}

	next(val)
	{
		this.value = val;
		super.next(val);
	}

}

class Event {

	constructor(type, target, value)
	{
		this.type = type;
		this.target = target;
		this.value = value;
	}

}

class Item {

	constructor(value, key, next)
	{
		this.value = value;
		this.key = key;
		this.next = next;
	}

}

class CollectionEvent {

	constructor(target, type, value, nextValue)
	{
		this.target = target;
		this.type = type;
		this.value = value;
		this.nextValue = nextValue;
	}

}

function map(operator)
{
	return source => new Observable(subscriber => {
		const subscription = source.subscribe(
			val => subscriber.next(operator(val)),
			subscriber.error.bind(subscriber),
			subscriber.complete.bind(subscriber)
		);
		return subscription.unsubscribe.bind(subscription);
	});
}

function operator(fn)
{
	return source => new Observable(subscriber => {
		const subscription = source.subscribe(fn(subscriber));
		return subscription.unsubscribe.bind(subscription);
	});
}

class EventEmitter
{
	on(type, callback, scope)
	{
		return this.addEventListener(type, callback, scope);
	}

	off(type, callback, scope)
	{
		return this.removeEventListener(type, callback, scope);
	}

	addEventListener(type, callback, scope)
	{
		if (!this.__handlers)
			this.__handlers = {};
		if (!this.__handlers[type])
			this.__handlers[type] = [];

		this.__handlers[type].push({ fn: callback, scope: scope });
		return { unsubscribe: this.off.bind(this, type, callback, scope) };
	}

	removeEventListener(type, callback, scope)
	{
	const
		handlers = (this.__handlers && this.__handlers[type]),
		h = handlers && handlers.find(h => h.fn === callback && h.scope===scope),
		i = handlers.indexOf(h)
	;
		if (i===-1)
			throw new Error('Invalid listener');

		handlers.splice(i, 1);
	}

	trigger(type, a, b, c)
	{
		if (this.__handlers && this.__handlers[type])
			this.__handlers[type].forEach(h => h.fn.call(h.scope, a, b, c));
	}

	once(type, callback, scope)
	{
		const subscriber = this.on(type, (a,b,c)=> {
			subscriber.unsubscribe();
			return callback.call(scope, a, b, c);
		});
	}
}

Object.assign(rx, {
	BehaviorSubject: BehaviorSubject,
	CollectionEvent: CollectionEvent,
	Event: Event,
	EventEmitter: EventEmitter,
	Item: Item,
	Observable: Observable,
	Subject: Subject,
	Subscriber: Subscriber,

	operators: {
		constructEvent(Constructor, field, extraArg)
		{
			return map(ev => {
				if (ev.type==='added' || ev.type==='removed')
					ev.value = new Constructor(field ? ev.value[field] : ev.value, extraArg);
				return ev;
			});
		},
		map: map,
		filter(fn) { return operator(subscriber => val => fn(val) && subscriber.next(val)); }
	}

});

})(this.cxl ? (this.cxl.rx={}) : module.exports);
