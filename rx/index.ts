type ObservableError = any;
type NextFunction<T> = (val: T) => void;
type ErrorFunction = (err: ObservableError) => void;
type CompleteFunction = () => void;
type UnsubscribeFunction = () => void;
type SubscribeFunction<T> = (
	subscription: Subscription<T>
) => UnsubscribeFunction | void;
type EventCallback = (...args: any) => void;

type Merge<T> = T extends Observable<infer U> ? U : never;
type ObservableT<T> = T extends Observable<infer U> ? U : never;
type PickObservable<T> = {
	[P in keyof T]: T[P] extends Observable<any> ? ObservableT<T[P]> : never;
};

export type Operator<T, T2 = T> = (observable: Observable<T>) => Observable<T2>;

declare function setTimeout(fn: () => any, n?: number): number;
declare function clearTimeout(n: number): void;

interface Observer<T> {
	next?: NextFunction<T>;
	error?: ErrorFunction;
	complete?: CompleteFunction;
}

type NextObserver<T> = NextFunction<T> | Observer<T> | undefined;

class Subscriber<T> {
	public next: NextFunction<T>;
	public error?: ErrorFunction;
	public complete?: CompleteFunction;

	constructor(
		observer?: NextObserver<T>,
		error?: ErrorFunction,
		complete?: CompleteFunction
	) {
		if (observer && typeof observer !== 'function') {
			error = observer.error && observer.error.bind(observer);
			complete = observer.complete && observer.complete.bind(observer);
			observer = observer.next && observer.next.bind(observer);
		}

		this.next = observer as NextFunction<T>;
		this.error = error;
		this.complete = complete;
	}
}

export class Subscription<T> {
	isUnsubscribed = false;
	onUnsubscribe: UnsubscribeFunction | void;
	subscriber: Subscriber<T>;

	constructor(subscriber: Subscriber<T>, subscribe?: SubscribeFunction<T>) {
		this.subscriber = subscriber;
		try {
			if (subscribe) this.onUnsubscribe = subscribe(this);
		} catch (e) {
			this.error(e);
		}
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
		if (!this.isUnsubscribed) {
			if (subscriber.error) subscriber.error(e);
			else throw e;
			this.unsubscribe();
		}
	}

	complete() {
		const subscriber = this.subscriber;
		if (!this.isUnsubscribed && subscriber.complete) subscriber.complete();
		this.unsubscribe();
	}

	unsubscribe() {
		if (!this.isUnsubscribed) {
			this.isUnsubscribed = true;
			if (this.onUnsubscribe) this.onUnsubscribe();
		}
	}
}

export function pipe<T>(...operators: Operator<T>[]): Operator<T> {
	return (source: Observable<T>) =>
		operators.reduce((prev, fn) => fn(prev), source);
}

class Observable<T> {
	protected __subscribe?: SubscribeFunction<T>;

	constructor(subscribe?: SubscribeFunction<T>) {
		if (subscribe) this.__subscribe = subscribe;
	}

	pipe<A>(a: Operator<T, A>): Observable<A>;
	pipe<A, B>(a: Operator<T, A>, b: Operator<A, B>): Observable<B>;
	pipe<A, B, C>(
		a: Operator<T, A>,
		b: Operator<A, B>,
		c: Operator<B, C>
	): Observable<C>;
	pipe<A, B, C, D>(
		a: Operator<T, A>,
		b: Operator<A, B>,
		c: Operator<B, C>,
		d: Operator<C, D>
	): Observable<D>;
	pipe<A, B, C, D, E>(
		a: Operator<T, A>,
		b: Operator<A, B>,
		c: Operator<B, C>,
		d: Operator<C, D>,
		e: Operator<D, E>
	): Observable<E>;
	pipe(...extra: Operator<any, any>[]): Observable<any> {
		return extra.reduce((prev, fn) => fn(prev), this as Observable<any>);
	}

	subscribe(
		observer?: NextObserver<T>,
		error?: ErrorFunction,
		complete?: CompleteFunction
	): Subscription<T> {
		const subscriber = new Subscriber(observer, error, complete);
		return new Subscription(
			subscriber,
			this.__subscribe && this.__subscribe.bind(this)
		);
	}

	tap(fn: (val: T) => void) {
		return this.pipe(tap(fn));
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
	constructor(public value: T) {
		super();
	}

	protected onSubscribe(subscription: Subscription<T>) {
		subscription.next(this.value);
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

	on = this.addEventListener;
	off = this.removeEventListener;
	trigger = this.emit;

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
			this.__handlers[type].slice().forEach(handler => {
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

	once(type: string, callback: EventCallback, scope: any) {
		const subscriber = this.on(type, (...args: any) => {
			subscriber.unsubscribe();
			return callback.call(scope, ...args);
		});
	}
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
					complete: onComplete,
				});
			else subscriber.complete();
		}

		onComplete();

		return () => {
			if (subscription) subscription.unsubscribe();
		};
	});
}

export function defer<T>(fn: () => Observable<T> | void) {
	return new Observable(subs => {
		const newObs = fn();
		if (newObs) {
			const innerSubs = newObs.subscribe(subs);
			return () => innerSubs.unsubscribe();
		}

		subs.complete();
	});
}

function from<T>(input: Array<T> | Promise<T> | Observable<T>): Observable<T> {
	if (input instanceof Observable) return input;

	return new Observable<T>(subs => {
		if (Array.isArray(input)) {
			input.forEach(item => subs.next(item));
			subs.complete();
		} else {
			input
				.then(result => {
					subs.next(result);
					subs.complete();
				})
				.catch(err => subs.error(err));
		}
	});
}

function of<T>(...values: T[]): Observable<T> {
	return new Observable<T>(subscriber => {
		values.forEach(val => subscriber.next(val));
		subscriber.complete();
	});
}

function toPromise<T>(observable: Observable<T>) {
	return new Promise<T>((resolve, reject) => {
		let value: T | undefined;
		observable.subscribe(
			(val?: T) => (value = val),
			(e: ObservableError) => reject(e),
			() => resolve(value)
		);
	});
}

/*
 * Operators
 */
function cleanUpSubscriber<T>(
	next: NextFunction<T>,
	subscriber: Subscription<T>,
	cleanup: () => void
): NextObserver<T> {
	return {
		next,
		error(e) {
			cleanup();
			subscriber.error(e);
		},
		complete() {
			cleanup();
			subscriber.complete();
		},
	};
}

export function operator<T, T2 = T>(
	fn: (subs: Subscription<T2>) => NextObserver<T>
): Operator<T, T2> {
	return (source: Observable<T>) =>
		new Observable<T2>(subscriber => {
			let next = fn(subscriber);
			if (typeof next === 'function')
				next = {
					next,
					error: subscriber.error.bind(subscriber),
					complete: subscriber.complete.bind(subscriber),
				};

			const subscription = source.subscribe(next);
			return subscription.unsubscribe.bind(subscription);
		});
}

function map<T, T2>(mapFn: (val: T) => T2) {
	return operator<T, T2>(subscriber => (val: T) => {
		subscriber.next(mapFn(val));
	});
}

function debounceFunction<A, R>(fn: (...a: A[]) => R, delay?: number) {
	let to: number;

	return function (this: any, ...args: A[]) {
		if (to) clearTimeout(to);
		to = setTimeout(() => {
			fn.apply(this, args);
		}, delay);
	};
}

export function collect<T>(source: Observable<T>, gate: Observable<any>) {
	const collected: T[] = [];

	return new Observable(subs => {
		const s1 = source.subscribe(val => collected.push(val));
		const s2 = gate.subscribe(() => {
			collected.forEach(c => subs.next(c));
			collected.length = 0;
		});

		return () => {
			s1.unsubscribe();
			s2.unsubscribe();
		};
	});
}

function debounceTime<T>(time?: number) {
	return operator<T>(subscriber =>
		debounceFunction(subscriber.next.bind(subscriber), time)
	);
}

export function switchMap<T, T2>(project: (val: T) => Observable<T2>) {
	let lastSubscription: Subscription<T2>;

	return operator(subscriber => (val: T) => {
		if (lastSubscription) lastSubscription.unsubscribe();

		const newObservable = project(val);
		lastSubscription = newObservable.subscribe(val => subscriber.next(val));
	});
}

export function mergeMap<T, T2>(project: (val: T) => Observable<T2>) {
	let subscriptions: Subscription<T2>[];

	return operator(subscriber =>
		cleanUpSubscriber(
			(val: T) => {
				const newObservable = project(val);
				subscriptions.push(
					newObservable.subscribe(val => subscriber.next(val))
				);
			},
			subscriber,
			() => subscriptions.forEach(s => s.unsubscribe())
		)
	);
}

export function exhaustMap<T, T2>(project: (value?: T) => Observable<T2>) {
	let lastSubscription: Subscription<T2> | null;

	function cleanup() {
		if (lastSubscription) {
			lastSubscription.unsubscribe();
			lastSubscription = null;
		}
	}

	return operator(subscriber =>
		cleanUpSubscriber(
			(val: T) => {
				if (!lastSubscription)
					lastSubscription = project(val).subscribe(
						cleanUpSubscriber(
							val => subscriber.next(val),
							subscriber,
							cleanup
						)
					);
			},
			subscriber,
			cleanup
		)
	);
}

function filter<T>(fn: (val: T) => boolean): Operator<T, T> {
	return operator((subscriber: Subscription<T>) => (val: T) => {
		if (fn(val)) subscriber.next(val);
	});
}

function tap<T>(fn: (val: T) => void): Operator<T, T> {
	return operator<T, T>((subscriber: Subscription<T>) => (val: T) => {
		fn(val);
		subscriber.next(val);
	});
}

function catchError<T, T2>(
	selector: (err: any, source: Observable<T>) => Observable<T2> | void
) {
	function subscribe(source: Observable<T>, subscriber: Subscription<T>) {
		const subscription = source.subscribe(
			subscriber.next.bind(subscriber),
			(err: any) => {
				let result: any;
				try {
					result = selector(err, source);
				} catch (err2) {
					return subscriber.error(err2);
				}
				subscribe(result, subscriber);
			},
			subscriber.complete.bind(subscriber)
		);
		return subscription.unsubscribe.bind(subscription);
	}

	return (source: Observable<T>) =>
		new Observable<T>(subscriber => subscribe(source, subscriber));
}

const initialDistinct = {};

function distinctUntilChanged<T>(): Operator<T, T> {
	let lastValue: T | typeof initialDistinct = initialDistinct;
	return operator((subscriber: Subscription<T>) => (val: T) => {
		if (val !== lastValue) {
			lastValue = val;
			subscriber.next(val);
		}
	});
}

function merge<R extends Observable<any>[]>(
	...observables: R
): R extends (infer U)[] ? Observable<Merge<U>> : never {
	if (observables.length === 1) return observables[0] as any;

	return new Observable(subs => {
		let refCount = observables.length;
		const subscriptions = observables.map(o =>
			o.subscribe({
				next(val) {
					subs.next(val);
				},
				error(e) {
					subs.error(e);
				},
				complete() {
					if (refCount-- === 1) subs.complete();
				},
			})
		);

		return () => subscriptions.forEach(s => s.unsubscribe());
	}) as any;
}

function combineLatest<T extends any[]>(
	...observables: T
): Observable<PickObservable<T>> {
	return new Observable<any>(subs => {
		const latest: any[] = [],
			len = observables.length;
		let count = 0,
			isReady = false;

		const subscriptions = observables.map((o, i) =>
			o.subscribe({
				next(val: any) {
					latest[i] = val;
					if (isReady || count + 1 === len) {
						const clone = latest.slice(0);
						isReady = true;
						subs.next(clone);
					} else count++;
				},
				error(e: any) {
					subs.error(e);
				},
				complete() {
					if (isReady && --count === 0) subs.complete();
				},
			})
		);

		return () => subscriptions.forEach(s => s.unsubscribe());
	});
}

function throwError(error: any) {
	return new Observable(subs => subs.error(error));
}

export const EMPTY = new Observable<void>(subs => subs.complete());

export function be<T>(initialValue: T) {
	return new BehaviorSubject(initialValue);
}

const operators = {
	catchError,
	debounceTime,
	distinctUntilChanged,
	map,
	tap,
	filter,
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
	from,
	toPromise,
	throwError,
	operators,
	catchError,
	map,
	tap,
	filter,
	debounceTime,
	distinctUntilChanged,
	concat,
	merge,
	combineLatest,
	of,
};
