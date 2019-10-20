type ObservableError = any;
type NextFunction<T> = (val: T) => void;
type ErrorFunction = (err: ObservableError) => void;
type CompleteFunction = () => void;
type UnsubscribeFunction = () => void;
type SubscribeFunction<T> = (
	subscription: Subscription<T>
) => UnsubscribeFunction | void;
type EventCallback = (...args: any) => void;

export type Operator<T> = (observable: Observable<T>) => Observable<T>;

interface Observer<T> {
	next: NextFunction<T>;
	error: ErrorFunction;
	complete: CompleteFunction;
}

type NextObserver<T> = NextFunction<T> | Observer<T> | undefined;

class Subscriber<T> {
	public next: NextFunction<T>;
	public error: ErrorFunction | undefined;
	public complete: CompleteFunction | undefined;

	constructor(
		observer: NextObserver<T> = () => {},
		error?: ErrorFunction,
		complete?: CompleteFunction
	) {
		if (observer && typeof observer !== 'function') {
			error = observer.error;
			complete = observer.complete;
			observer = observer.next;
		}

		this.next = observer as NextFunction<T>;
		this.error = error;
		this.complete = complete;
	}
}

export class Subscription<T> {
	isUnsubscribed = false;
	onUnsubscribe: UnsubscribeFunction | void;

	constructor(
		private subscriber: Subscriber<T>,
		subscribe: SubscribeFunction<T>
	) {
		this.onUnsubscribe = subscribe(this);
	}

	next(val: T) {
		const subscriber = this.subscriber;

		try {
			if (!this.isUnsubscribed && subscriber.next) subscriber.next(val);
		} catch (e) {
			this.error(e);
		}
	}

	error(e: ObservableError) {
		const subscriber = this.subscriber;
		if (!this.isUnsubscribed && subscriber.error) subscriber.error(e);
		this.unsubscribe();
	}

	complete() {
		const subscriber = this.subscriber;
		if (!this.isUnsubscribed && subscriber.complete) subscriber.complete();
		this.unsubscribe();
	}

	unsubscribe() {
		this.isUnsubscribed = true;
		if (this.onUnsubscribe) this.onUnsubscribe();
	}
}

class Observable<T> {
	static create<T2>(A: any): Observable<T2> {
		return new this(A);
	}

	protected __subscribe(
		_subscription?: Subscription<T>
	): UnsubscribeFunction | void {
		return () => {};
	}

	constructor(subscribe?: SubscribeFunction<T>) {
		if (subscribe) this.__subscribe = subscribe;
	}

	pipe(operator: Operator<T>, ...extra: Operator<T>[]): Observable<T> {
		return extra
			? extra.reduce((prev, fn) => fn(prev), operator(this))
			: operator(this);
	}

	subscribe(
		observer?: NextObserver<T>,
		error?: ErrorFunction,
		complete?: CompleteFunction
	): Subscription<T> {
		const subscriber = new Subscriber(observer, error, complete);
		return new Subscription(subscriber, this.__subscribe.bind(this));
	}
}

class Subject<T> extends Observable<T> {
	protected subscriptions = new Set<Subscription<T>>();

	protected onSubscribe(subscriber: Subscription<T>): UnsubscribeFunction {
		this.subscriptions.add(subscriber);
		return () => this.subscriptions.delete(subscriber);
	}

	constructor() {
		super((subscription: Subscription<T>) =>
			this.onSubscribe(subscription)
		);
	}

	next(a: T): void {
		this.subscriptions.forEach(s => s.next(a));
	}
	error(e: ObservableError): void {
		this.subscriptions.forEach(s => s.error(e));
	}
	complete(): void {
		this.subscriptions.forEach(s => s.complete());
	}
}

class BehaviorSubject<T> extends Subject<T> {
	constructor(public value?: T) {
		super();
	}

	protected onSubscribe(subscription: Subscription<T>) {
		if (this.value !== undefined) subscription.next(this.value);
		return super.onSubscribe(subscription);
	}

	next(val: T) {
		this.value = val;
		super.next(val);
	}
}

class Event {
	constructor(public type: string, public target: any, public value: any) {}
}

class Item {
	constructor(public value: any, public key: string, public next: any) {}
}

class CollectionEvent {
	constructor(
		public target: any,
		public type: string,
		public value: any,
		public nextValue: any
	) {}
}

class EventEmitter {
	private __handlers: { [key: string]: any[] } | undefined;

	on(type: string, callback: EventCallback, scope?: any) {
		return this.addEventListener(type, callback, scope);
	}

	off(type: string, callback: EventCallback, scope?: any) {
		return this.removeEventListener(type, callback, scope);
	}

	addEventListener(type: string, callback: EventCallback, scope?: any) {
		if (!this.__handlers) this.__handlers = {};
		if (!this.__handlers[type]) this.__handlers[type] = [];

		this.__handlers[type].push({ fn: callback, scope: scope });
		return { unsubscribe: this.off.bind(this, type, callback, scope) };
	}

	removeEventListener(type: string, callback: EventCallback, scope?: any) {
		const handlers = this.__handlers && this.__handlers[type];

		if (!handlers) throw new Error('Invalid arguments');

		const h =
				handlers &&
				handlers.find(h => h.fn === callback && h.scope === scope),
			i = handlers.indexOf(h);
		if (i === -1) throw new Error('Invalid listener');

		handlers.splice(i, 1);
	}

	$eachHandler(type: string, fn: (handler: any) => void) {
		if (this.__handlers && this.__handlers[type])
			this.__handlers[type].forEach(handler => {
				try {
					fn(handler);
				} catch (e) {
					if (type !== 'error') this.trigger('error', e);
					else throw e;
				}
			});
	}

	emit(type: string, ...args: any) {
		this.$eachHandler(type, handler =>
			handler.fn.call(handler.scope, ...args)
		);
	}

	emitAndCollect(type: string, ...args: any): any[] {
		const result: any[] = [];

		this.$eachHandler(type, handler =>
			result.push(handler.fn.call(handler.scope, ...args))
		);

		return result;
	}

	trigger(type: string, ...args: any) {
		return this.emit(type, ...args);
	}

	once(type: string, callback: EventCallback, scope: any) {
		const subscriber = this.on(type, (...args: any) => {
			subscriber.unsubscribe();
			return callback.call(scope, ...args);
		});
	}
}

function toPromise<T>(observable: Observable<T>) {
	return new Promise<T>((resolve, reject) => {
		let value: T;
		observable.subscribe(
			(val: T) => (value = val),
			(e: ObservableError) => reject(e),
			() => resolve(value)
		);
	});
}

export function operator<T>(
	fn: (subs: Subscription<T>) => NextObserver<T>
): Operator<T> {
	return (source: Observable<T>) =>
		new Observable<T>(subscriber => {
			const subscription = source.subscribe(fn(subscriber));
			return subscription.unsubscribe.bind(subscription);
		});
}

function map<T, T2>(mapFn: (val: T) => T2) {
	return (source: Observable<T>) =>
		new Observable<T2>(subscriber => {
			const subscription = source.subscribe(
				val => subscriber.next(mapFn(val)),
				subscriber.error.bind(subscriber),
				subscriber.complete.bind(subscriber)
			);
			return subscription.unsubscribe.bind(subscription);
		});
}

function filter<T>(fn: (val: T) => boolean): Operator<T> {
	return operator((subscriber: Subscription<T>) => (val: T) => {
		if (fn(val)) subscriber.next(val);
	});
}

function tap<T>(fn: (val: T) => any): Operator<T> {
	return operator((subscriber: Subscription<T>) => (val: T) => {
		fn(val);
		subscriber.next(val);
	});
}

function distinctUntilChanged<T>(): Operator<T> {
	let lastValue: T;
	return operator((subscriber: Subscription<T>) => (val: T) => {
		if (val !== lastValue) {
			lastValue = val;
			subscriber.next(val);
		}
	});
}

function concat(...observables: Observable<any>[]) {
	return new Observable<any>(subscriber => {
		let subscription: Subscription<any>;

		function onComplete() {
			const next = observables.shift();
			if (next)
				subscription = next.subscribe({
					next(val) {
						subscriber.next(val);
					},
					error(err) {
						subscriber.error(err);
					},
					complete: onComplete
				});
			else subscriber.complete();
		}

		onComplete();

		return () => {
			if (subscription) subscription.unsubscribe();
		};
	});
}

function of<T>(...values: T[]): Observable<T> {
	return new Observable<T>(subscriber => {
		values.forEach(val => subscriber.next(val));
		subscriber.complete();
	});
}

const operators = {
	map,
	tap,
	filter,
	distinctUntilChanged
};

export {
	Observable,
	BehaviorSubject,
	CollectionEvent,
	Event,
	EventEmitter,
	Item,
	Subject,
	Subscriber,
	toPromise,
	operators,
	map,
	tap,
	filter,
	distinctUntilChanged,
	concat,
	of
};
