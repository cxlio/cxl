type ObservableError = any;
type NextFunction<T> = (val: T) => void;
type ErrorFunction = (err: ObservableError) => void;
type CompleteFunction = () => void;
type UnsubscribeFunction = () => void;
type SubscribeFunction<T> = (
	subscription: Subscriber<T>
) => UnsubscribeFunction | void;
type Merge<T> = T extends Observable<infer U> ? U : never;
type ObservableT<T> = T extends Observable<infer U> ? U : never;
type PickObservable<T> = {
	[P in keyof T]: T[P] extends Observable<any> ? ObservableT<T[P]> : never;
};

export type Operator<T, T2 = T> = (observable: Observable<T>) => Observable<T2>;

export interface Observer<T> {
	next?: NextFunction<T>;
	error?: ErrorFunction;
	complete?: CompleteFunction;
}

export interface Subscribable<T> {
	subscribe(observer: Observer<T>): Subscription;
}

// Used for observable interoperability
export const observableSymbol = '@@observable';

export interface InteropObservable<T> {
	[observableSymbol]: () => Subscribable<T>;
}

type NextObserver<T> = NextFunction<T> | Observer<T> | undefined;

function getObserver<T>(
	next?: NextObserver<T>,
	error?: ErrorFunction,
	complete?: CompleteFunction
): Observer<T> {
	if (next && typeof next !== 'function') {
		error = next.error && next.error.bind(next);
		complete = next.complete && next.complete.bind(next);
		next = next.next && next.next.bind(next);
	}

	return { next, error, complete };
}

export interface Subscription {
	unsubscribe(): void;
}

export class Subscriber<T> {
	isUnsubscribed = false;
	onUnsubscribe: UnsubscribeFunction | void;
	subscriber: Observer<T>;

	constructor(subscriber: Observer<T>, subscribe?: SubscribeFunction<T>) {
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

/**
 * Used to stitch together functional operators into a chain.
 */
export function pipe<T, A, B>(
	a: Operator<T, A>,
	b: Operator<A, B>
): Operator<T, B>;
export function pipe<T, A, B, C>(
	a: Operator<T, A>,
	b: Operator<A, B>,
	c: Operator<B, C>
): Operator<T, C>;
export function pipe<T, A, B, C, D>(
	a: Operator<T, A>,
	b: Operator<A, B>,
	c: Operator<B, C>,
	d: Operator<C, D>
): Operator<T, D>;
export function pipe<T, A, B, C, D, E>(
	a: Operator<T, A>,
	b: Operator<A, B>,
	c: Operator<B, C>,
	d: Operator<C, D>,
	e: Operator<D, E>
): Operator<T, E>;
export function pipe(...operators: Operator<any>[]): Operator<any> {
	return (source: Observable<any>) =>
		operators.reduce((prev, fn) => fn(prev), source);
}

/**
 * A representation of any set of values over any amount of time.
 */
export class Observable<T> {
	[observableSymbol]() {
		return this;
	}
	protected __subscribe?: SubscribeFunction<T>;

	constructor(subscribe?: SubscribeFunction<T>) {
		if (subscribe) this.__subscribe = subscribe;
	}

	then<E, R>(resolve: (val: T) => R, reject?: (e: E) => R): Promise<R> {
		return toPromise(this).then(resolve, reject);
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

	/**
	 * Used to stitch together functional operators into a chain.
	 */
	pipe(...extra: Operator<any, any>[]): Observable<any> {
		return extra.reduce((prev, fn) => fn(prev), this as Observable<any>);
	}

	/**
	 * Invokes an execution of an Observable and registers Observer handlers for notifications it will emit.
	 */
	subscribe(
		next?: NextObserver<T>,
		error?: ErrorFunction,
		complete?: CompleteFunction
	): Subscription {
		const observer = getObserver(next, error, complete);
		return new Subscriber<T>(
			observer,
			this.__subscribe && this.__subscribe.bind(this)
		);
	}
}

/**
 * A Subject is an Observable that allows values to be
 * multicasted to many Observers.
 */
export class Subject<T> extends Observable<T> {
	protected observers = new Set<Subscriber<T>>();

	protected onSubscribe(subscriber: Subscriber<T>): UnsubscribeFunction {
		this.observers.add(subscriber);
		return () => this.observers.delete(subscriber);
	}

	constructor() {
		super((subscription: Subscriber<T>) => this.onSubscribe(subscription));
	}

	next(a: T): void {
		this.observers.forEach(s => s.next(a));
	}
	error(e: ObservableError): void {
		this.observers.forEach(s => s.error(e));
	}
	complete(): void {
		this.observers.forEach(s => s.complete());
	}
}

/**
 * A variant of Subject that requires an initial value and emits its current value whenever it is subscribed to.
 * @see be
 */
export class BehaviorSubject<T> extends Subject<T> {
	constructor(private currentValue: T) {
		super();
	}

	get value() {
		return this.currentValue;
	}

	protected onSubscribe(subscription: Subscriber<T>) {
		const result = super.onSubscribe(subscription);
		subscription.next(this.currentValue);
		return result;
	}

	next(val: T) {
		this.currentValue = val;
		super.next(val);
	}
}

/**
 * A variant of Subject that "replays" or emits old values to new subscribers.
 * It buffers a set number of values and will emit those values immediately to any
 * new subscribers in addition to emitting new values to existing subscribers.
 */
export class ReplaySubject<T, ErrorT = any> extends Subject<T> {
	private buffer: T[] = [];
	private isComplete = false;
	private hasError = false;
	private lastError?: ErrorT;

	constructor(public readonly bufferSize: number = Infinity) {
		super();
	}

	protected onSubscribe(subscription: Subscriber<T>) {
		const result = super.onSubscribe(subscription);
		this.buffer.forEach(val => subscription.next(val));
		if (this.hasError) subscription.error(this.lastError as ErrorT);
		else if (this.isComplete) subscription.complete();
		return result;
	}

	complete() {
		this.isComplete = true;
		super.complete();
	}

	error(val: ErrorT) {
		this.hasError = true;
		this.lastError = val;
		super.error(val);
	}

	next(val: T) {
		if (this.buffer.length === this.bufferSize) this.buffer.shift();

		this.buffer.push(val);
		return super.next(val);
	}
}

const Undefined = {};

/**
 * A Reference is a behavior subject that does not require an initial value.
 */
export class Reference<T> extends Subject<T> {
	private $value: T | typeof Undefined = Undefined;

	get value(): T {
		if (this.$value === Undefined)
			throw new Error('Reference not initialized');
		return this.$value as any;
	}

	protected onSubscribe(subscription: Subscriber<T>) {
		if (this.$value !== Undefined) subscription.next(this.$value as T);
		return super.onSubscribe(subscription);
	}

	next(val: T) {
		this.$value = val;
		return super.next(val);
	}
}

/**
 * Creates an output Observable which sequentially emits all values from given Observable and then moves on to the next.
 */
export function concat<R extends Observable<any>[]>(
	...observables: R
): R extends (infer U)[] ? Observable<Merge<U>> : never {
	return new Observable(subscriber => {
		let subscription: Subscription;
		let index = 0;

		function onComplete() {
			const next = observables[index++];
			if (next)
				subscription = next.subscribe({
					next: val => subscriber.next(val),
					error: err => subscriber.error(err),
					complete: onComplete,
				});
			else subscriber.complete();
		}

		onComplete();

		return () => {
			if (subscription) subscription.unsubscribe();
		};
	}) as any;
}

/**
 * Creates an Observable that, on subscribe, calls an Observable factory to make an Observable for each new Observer.
 */
export function defer<T>(fn: () => Observable<T> | void) {
	return new Observable<T>(subs => {
		const newObs = fn();
		if (newObs) {
			const innerSubs = newObs.subscribe(subs);
			return () => innerSubs.unsubscribe();
		}

		subs.complete();
	});
}

export function isInterop<T>(obs: any): obs is InteropObservable<T> {
	return !!obs[observableSymbol];
}

function fromSubscribable<T>(obs: Subscribable<T>) {
	return new Observable<T>(subs => {
		const subscription = obs.subscribe(subs);
		return () => subscription.unsubscribe();
	});
}

/**
 * Creates an Observable from an Array, an array-like object, a Promise, an iterable object, or an Observable-like object.
 */
export function from<T>(
	input: Array<T> | Promise<T> | Observable<T> | InteropObservable<T>
): Observable<T> {
	if (input instanceof Observable) return input;
	if (isInterop(input)) return fromSubscribable(input[observableSymbol]());

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

/**
 * Converts the arguments to an observable sequence.
 */
export function of<T>(...values: T[]): Observable<T> {
	return new Observable<T>(subscriber => {
		values.forEach(val => subscriber.next(val));
		subscriber.complete();
	});
}

/**
 * Generates a promise from an observable, the promise will resolve when the observable completes.
 */
export function toPromise<T>(observable: Observable<T>) {
	return new Promise<T>((resolve, reject) => {
		let value: T;
		observable.subscribe(
			(val: T) => (value = val),
			(e: ObservableError) => reject(e),
			() => resolve(value)
		);
	});
}

/*
 * Operators
 */
function cleanUpSubscriber<T, T2>(
	next: NextFunction<T>,
	subscriber: Subscriber<T2>,
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
	fn: (subs: Subscriber<T2>) => NextObserver<T>
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

/**
 * Applies a given project function to each value emitted by the source Observable, and emits the resulting values as an Observable.
 */
export function map<T, T2>(mapFn: (val: T) => T2) {
	return operator<T, T2>(subscriber => (val: T) => {
		subscriber.next(mapFn(val));
	});
}

export function is<T>(equalTo: T) {
	return operator<T, boolean>(subs => (val: T) => subs.next(val === equalTo));
}

export function reduce<T, T2>(
	reduceFn: (acc: T2, val: T, i: number) => T2,
	seed: T2
) {
	return operator<T, T2>(subscriber => {
		let acc = seed;
		let i = 0;
		return {
			next(val: T) {
				acc = reduceFn(acc, val, i++);
			},
			complete() {
				subscriber.next(acc);
				subscriber.complete();
			},
		};
	});
}

export function debounce<A extends any[], R>(
	fn: (...a: A) => R,
	delay?: number
) {
	let to: number;
	return function (this: any, ...args: A) {
		if (to) clearTimeout(to);
		to = setTimeout(() => {
			fn.apply(this, args);
		}, delay);
	};
}

export function collect<T>(source: Observable<T>, gate: Observable<any>) {
	const collected: T[] = [];

	return new Observable<T>(subs => {
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

/**
 * Emits a value from the source Observable only after a particular time span has passed without another source emission.
 */
export function debounceTime<T>(time?: number) {
	let to: number,
		completed = false;

	return operator<T>(subscriber => ({
		next(val: T) {
			if (to) clearTimeout(to);
			to = setTimeout(() => {
				subscriber.next(val);
				to = 0;
				if (completed) subscriber.complete();
			}, time);
		},
		error(e) {
			if (to) clearTimeout(to);
			subscriber.error(e);
		},
		complete() {
			if (to) completed = true;
			else subscriber.complete();
		},
	}));
}

/**
 * Projects each source value to an Observable which is merged in the output Observable,
 * emitting values only from the most recently projected Observable.
 */
export function switchMap<T, T2>(project: (val: T) => Observable<T2>) {
	return operator<T, T2>(subscriber => {
		let lastSubscription: Subscription;
		return (val: T) => {
			if (lastSubscription) lastSubscription.unsubscribe();

			const newObservable = project(val);
			lastSubscription = newObservable.subscribe(val =>
				subscriber.next(val)
			);
		};
	});
}

/**
 * Projects each source value to an Observable which is merged in the output Observable.
 */
export function mergeMap<T, T2>(project: (val: T) => Observable<T2>) {
	const subscriptions: Subscription[] = [];

	return operator<T, T2>(subscriber =>
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

/**
 * Projects each source value to an Observable which is merged in the output Observable
 * only if the previous projected Observable has completed.
 */
export function exhaustMap<T, T2>(project: (value?: T) => Observable<T2>) {
	let lastSubscription: Subscription | null;

	function cleanup() {
		if (lastSubscription) {
			lastSubscription.unsubscribe();
			lastSubscription = null;
		}
	}

	return operator<T, T2>(subscriber =>
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

/**
 * Filter items emitted by the source Observable.
 *
 * @see distinctUntilChanged
 */
export function filter<T>(fn: (val: T) => boolean): Operator<T, T> {
	return operator((subscriber: Subscriber<T>) => (val: T) => {
		if (fn(val)) subscriber.next(val);
	});
}

/**
 * Emits only the first count values emitted by the source Observable.
 */
export function take<T>(howMany: number) {
	return operator((subs: Subscriber<T>) => (val: T) => {
		if (howMany-- > 0) subs.next(val);
		if (howMany <= 0) subs.complete();
	});
}

/**
 * Emits only the first value emitted by the source Observable.
 */
export function first<T>() {
	return operator((subs: Subscriber<T>) => (val: T) => {
		subs.next(val);
		subs.complete();
	});
}

/**
 * Perform a side effect for every emission on the source Observable,
 * but return an Observable that is identical to the source.
 */
export function tap<T>(fn: (val: T) => void): Operator<T, T> {
	return operator<T, T>((subscriber: Subscriber<T>) => (val: T) => {
		fn(val);
		subscriber.next(val);
	});
}

/**
 * Catches errors on the observable.
 *
 * @param selector A function that takes as arguments the error `err`,  and `source`, which
 *  is the source observable. The observable
 *  returned will be used to continue the observable chain.
 *
 */
export function catchError<T>(
	selector: (err: any, source: Observable<T>) => Observable<T> | void
) {
	function subscribe(source: Observable<T>, subscriber: Subscriber<T>) {
		const subscription = source.subscribe(
			subscriber.next.bind(subscriber),
			(err: any) => {
				try {
					const result = selector(err, source);
					if (result) subscribe(result, subscriber);
				} catch (err2) {
					return subscriber.error(err2);
				}
			},
			subscriber.complete.bind(subscriber)
		);
		return subscription.unsubscribe.bind(subscription);
	}

	return (source: Observable<T>) =>
		new Observable<T>(subscriber => subscribe(source, subscriber));
}

const initialDistinct = {};

/**
 * Returns an Observable that emits all items emitted by the source Observable
 * that are distinct by comparison from the previous item.
 */
export function distinctUntilChanged<T>(): Operator<T, T> {
	return operator((subscriber: Subscriber<T>) => {
		let lastValue: T | typeof initialDistinct = initialDistinct;
		return (val: T) => {
			if (val !== lastValue) {
				lastValue = val;
				subscriber.next(val);
			}
		};
	});
}

export function publishLast<T>(): Operator<T, T> {
	return (source: Observable<T>) => {
		const subject = new Subject<T>();
		let sourceSubscription: Subscription;
		let lastValue: T;
		let ready = false;

		return observable<T>(subs => {
			let subjectSubscription: Subscription;
			if (ready) {
				subs.next(lastValue);
				subs.complete();
			} else subjectSubscription = subject.subscribe(subs);

			if (!sourceSubscription)
				sourceSubscription = source.subscribe(
					val => (lastValue = val),
					e => subs.error(e),
					() => {
						ready = true;
						subject.next(lastValue);
						subject.complete();
					}
				);

			return () => subjectSubscription?.unsubscribe();
		});
	};
}

/**
 * Creates an output Observable which concurrently emits all values from every given input Observable.
 */
export function merge<R extends Observable<any>[]>(
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

/**
 * Combines multiple Observables to create an Observable whose values are calculated from the values, in order, of each of its input Observables.
 */
export function zip<T extends any[]>(
	...observables: T
): Observable<PickObservable<T>> {
	return observables.length === 0
		? EMPTY
		: new Observable<any>(subs => {
				const buffer: any[][] = new Array(observables.length);
				const subscriptions: Subscription[] = [];
				let completed = 0;

				function flush() {
					let hasNext = true;
					for (const bucket of buffer)
						if (!bucket || bucket.length === 0) {
							hasNext = false;
							break;
						}
					if (hasNext) {
						subs.next(buffer.map(b => b.shift()));
						flush();
					}

					if (completed) {
						for (const bucket of buffer)
							if (bucket.length !== 0) return;
						subs.complete();
						for (const s of subscriptions) s.unsubscribe();
					}
				}

				observables.forEach((o, id) => {
					const bucket: any[] = (buffer[id] = []);
					subscriptions.push(
						o.subscribe({
							next(val: any) {
								bucket.push(val);
								flush();
							},
							error(e: any) {
								subs.error(e);
							},
							complete() {
								completed++;
								flush();
							},
						})
					);
				});

				return () => subscriptions.forEach(s => s.unsubscribe());
		  });
}

/**
 * Combines multiple Observables to create an Observable whose values are calculated from the
 * latest values of each of its input Observables.
 */
export function combineLatest<T extends Observable<any>[]>(
	...observables: T
): Observable<PickObservable<T>> {
	return observables.length === 0
		? EMPTY
		: new Observable<any>(subs => {
				const buffer: any[][] = new Array(observables.length);
				const subscriptions: Subscription[] = [];
				let completed = 0;
				let last: any[];

				function flush() {
					for (const bucket of buffer)
						if (!bucket || bucket.length === 0) return;

					last = buffer.map((b, i) =>
						b.length ? b.shift() : last[i]
					);
					subs.next(last);
				}

				observables.forEach((o, id) => {
					const bucket: any[] = (buffer[id] = []);
					subscriptions.push(
						o.subscribe({
							next(val: any) {
								if (last) {
									bucket.push(val);
									buffer.forEach((b, i) => {
										if (b.length) {
											last[i] = b.shift();
											subs.next(last.slice(0));
										}
									});
								} else {
									bucket.push(val);
									flush();
								}
							},
							error(e: any) {
								subs.error(e);
							},
							complete() {
								if (++completed === observables.length) {
									let remaining = 0;
									do {
										remaining = 0;
										buffer.forEach((b, i) => {
											if (b.length) {
												remaining += b.length;
												last[i] = b.shift();
												subs.next(last.slice(0));
											}
										});
									} while (remaining);

									subs.complete();
								}
							},
						})
					);
				});

				return () => subscriptions.forEach(s => s.unsubscribe());
		  });
}

/**
 * Returns an Observable that mirrors the source Observable, but will call a
 * specified function when the source terminates on complete or error.
 */
export function finalize<T>(fn: () => void): Operator<T, T> {
	return operator<T, T>((subscriber: Subscriber<T>) => ({
		next: (val: T) => subscriber.next(val),
		error: (e: any) => {
			subscriber.error(e), fn();
		},
		complete() {
			subscriber.complete();
			fn();
		},
	}));
}

/**
 * Creates an Observable that emits no items to the Observer and immediately emits an error notification.
 */
export function throwError(error: any) {
	return new Observable<never>(subs => subs.error(error));
}

/**
 * An observable that completes on subscription.
 */
export const EMPTY = new Observable<never>(subs => subs.complete());

/**
 * Creates a new Behavior Subject.
 */
export function be<T>(initialValue: T) {
	return new BehaviorSubject(initialValue);
}

/**
 * Creates a new Observable
 */
export function observable<T>(subscribe: SubscribeFunction<T>) {
	return new Observable<T>(subscribe);
}

/**
 * Creates a new Subject
 */
export function subject<T>() {
	return new Subject<T>();
}

/**
 * Creates a new Reference object. A reference is a Behavior Subject that does not require an initial value.
 */
export function ref<T>() {
	return new Reference<T>();
}

const operators: any = {
	catchError,
	debounceTime,
	distinctUntilChanged,
	filter,
	finalize,
	first,
	is,
	map,
	mergeMap,
	publishLast,
	reduce,
	switchMap,
	take,
	tap,
};

for (const p in operators) {
	(Observable.prototype as any)[p] = function (...args: any) {
		return this.pipe((operators as any)[p](...args));
	};
}

export interface Observable<T> {
	catchError<T2>(
		selector: (err: any, source: Observable<T>) => Observable<T2> | void
	): Observable<T2>;
	debounceTime(time?: number): Observable<T>;
	distinctUntilChanged(): Observable<T>;
	filter<T2 = T>(fn: (val: T) => boolean): Observable<T2>;
	finalize(fn: () => void): Observable<T>;
	first(): Observable<T>;
	is(equalTo: T): Observable<boolean>;
	map<T2>(mapFn: (val: T) => T2): Observable<T2>;
	mergeMap<T2>(project: (val: T) => Observable<T2>): Observable<T2>;
	publishLast(): Observable<T>;
	reduce<T2>(
		reduceFn: (acc: T2, val: T, i: number) => T2,
		seed: T2
	): Observable<T2>;
	switchMap<T2>(project: (val: T) => Observable<T2>): Observable<T2>;
	take(howMany: number): Observable<T>;
	tap(tapFn: (val: T) => void): Observable<T>;
}

interface InsertEvent<T> {
	type: 'insert';
	item: T;
}

interface EmptyEvent {
	type: 'empty';
}

export type ListEvent<T> = InsertEvent<T> | EmptyEvent;
