(cxl => {

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

	__subscribe(subscriber)
	{
		const subscribers = this.__subscribers || (this.__subscribers=new Set());

		subscribers.add(subscriber);

		if (this.onSubscribe)
			this.onSubscribe(subscriber);

		return subscribers.delete.bind(subscribers, subscriber);
	}

	next(a) {
		if (this.__subscribers)
			this.__subscribers.forEach(s => s.next(a));
	}

	error(e) {
		if (this.__subscribers)
			this.__subscribers.forEach(s => s.error(e));
	}

	complete() {
		if (this.__subscribers)
			this.__subscribers.forEach(s => s.complete());
	}

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

/*class Collection extends Observable {

	__subscribe(subscriber)
	{
		this.items.forEach((val, key) => {
			this.trigger.call(subscriber, 'added', val, this.items[key+1]);
		});
	}

	indexOf(item)
	{
		return this.items.indexOf(item);
	}

	remove(item)
	{
		var i = this.indexOf(item);

		if (i===-1)
			throw new Error("Invalid item");

		this.items.splice(i, 1);
		this.trigger('removed', item);
	}

	trigger(event, item, nextItem)
	{
		this.next(new CollectionEvent(this, event, item, nextItem));
	}
}

class ArrayCollection extends Collection
{
	constructor(native)
	{
		super();
		this.items = native || [];
	}

	insert(value, next)
	{
		if (!next)
			this.items.push(value);
		else
		{
			let i = this.indexOf(next);
			this.items.splice(i, 0, value);
		}

		this.trigger('added', value, next);
	}

	empty()
	{
		while (this.items[0])
			this.remove(0);
	}
}*/

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

function pipe(fn)
{
	return source => new Observable(subscriber => {
		const subscription = source.subscribe(fn(subscriber));
		return subscription.unsubscribe.bind(subscription);
	});
}

cxl.rx = {
	//ArrayCollection: ArrayCollection,
	BehaviorSubject: BehaviorSubject,
	//Collection: Collection,
	CollectionEvent: CollectionEvent,
	Event: Event,
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
		filter(fn) { return pipe(subscriber => val => fn(val) && subscriber.next(val)); }
	}

};

})(this.cxl);