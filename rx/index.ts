///<amd-module name="@cxl/rx"/>

declare const setTimeout: (fn: () => unknown, n?: number) => number;
declare const clearTimeout: (n: number) => void;
declare const setInterval: (fn: () => unknown, n?: number) => number;
declare const clearInterval: (n: number) => void;

type ObservableError = unknown;
type NextFunction<T> = (val: T) => void;
type ErrorFunction = (err: ObservableError) => void;
type CompleteFunction = () => void;
type UnsubscribeFunction = () => void;
type SubscribeFunction<T> = (
	subscription: Subscriber<T>,
) => UnsubscribeFunction | void | Promise<void>;
type Merge<T> = T extends Observable<infer U> ? U : never;
type ObservableT<T> = T extends Observable<infer U> ? U : never;
type PickObservable<T> = {
	[P in keyof T]: T[P] extends Observable<unknown>
		? ObservableT<T[P]>
		: never;
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

export interface Subscription {
	unsubscribe(): void;
}

export class Subscriber<T> {
	private onUnsubscribe: UnsubscribeFunction | void = undefined;
	private teardown?: () => void;
	closed = false;

	constructor(
		private observer: Observer<T>,
		subscribe?: SubscribeFunction<T>,
		fwd?: (subscriber: Subscription) => void,
	) {
		try {
			if (fwd) fwd(this);
			if (subscribe) {
				const unsub = subscribe(this);
				if (!(unsub instanceof Promise)) this.onUnsubscribe = unsub;
			}
			if (this.closed && this.onUnsubscribe) this.onUnsubscribe();
		} catch (e) {
			this.error(e);
		}
	}

	setTeardown(teardown: () => void) {
		if (this.teardown) throw new Error('teardown method already set');
		this.teardown = teardown;
	}

	next(val: T) {
		if (this.closed) return;
		try {
			this.observer.next?.(val);
		} catch (e) {
			this.error(e);
		}
	}

	error(e: ObservableError) {
		if (!this.closed) {
			const subscriber = this.observer;
			if (!subscriber.error) {
				this.unsubscribe();
				throw e;
			}
			try {
				subscriber.error(e);
			} finally {
				this.unsubscribe();
			}
		} else throw e;
	}

	complete() {
		if (!this.closed) {
			try {
				this.observer.complete?.();
			} finally {
				this.unsubscribe();
			}
		}
	}

	unsubscribe() {
		if (!this.closed) {
			this.closed = true;
			this.teardown?.();
			if (this.onUnsubscribe) this.onUnsubscribe();
		}
	}
}

/**
 * Used to stitch together functional operators into a chain.
 */
export function pipe<T, A, B>(
	a: Operator<T, A>,
	b: Operator<A, B>,
): Operator<T, B>;
export function pipe<T, A, B, C>(
	a: Operator<T, A>,
	b: Operator<A, B>,
	c: Operator<B, C>,
): Operator<T, C>;
export function pipe<T, A, B, C, D>(
	a: Operator<T, A>,
	b: Operator<A, B>,
	c: Operator<B, C>,
	d: Operator<C, D>,
): Operator<T, D>;
export function pipe<T, A, B, C, D, E>(
	a: Operator<T, A>,
	b: Operator<A, B>,
	c: Operator<B, C>,
	d: Operator<C, D>,
	e: Operator<D, E>,
): Operator<T, E>;
export function pipe(...operators: Operator<unknown>[]): Operator<unknown> {
	return (source: Observable<unknown>) =>
		operators.reduce((prev, fn) => fn(prev), source);
}

/*eslint @typescript-eslint/no-unsafe-declaration-merging:off */

/**
 * A representation of any set of values over any amount of time.
 */
export class Observable<T, P = 'none'> {
	[observableSymbol]() {
		return this;
	}

	constructor(protected __subscribe: SubscribeFunction<T>) {}

	then<E, R>(
		resolve: (val: P extends 'emit1' ? T : T | undefined) => R,
		reject?: (e: E) => R,
	): Promise<R> {
		return toPromise(this).then(resolve, reject);
	}

	pipe<A>(a: Operator<T, A>): Observable<A>;
	pipe<A, B>(a: Operator<T, A>, b: Operator<A, B>): Observable<B>;
	pipe<A, B, C>(
		a: Operator<T, A>,
		b: Operator<A, B>,
		c: Operator<B, C>,
	): Observable<C>;
	pipe<A, B, C, D>(
		a: Operator<T, A>,
		b: Operator<A, B>,
		c: Operator<B, C>,
		d: Operator<C, D>,
	): Observable<D>;
	pipe<A, B, C, D, E>(
		a: Operator<T, A>,
		b: Operator<A, B>,
		c: Operator<B, C>,
		d: Operator<C, D>,
		e: Operator<D, E>,
	): Observable<E>;

	/**
	 * Used to stitch together functional operators into a chain.
	 */
	pipe(
		...extra: [Operator<T, unknown>, ...Operator<unknown, unknown>[]]
	): Observable<unknown> {
		return extra.reduce(
			(prev, fn) => fn(prev as Observable<T>),
			this as Observable<unknown>,
		);
	}

	/**
	 * Invokes an execution of an Observable and registers Observer handlers for notifications it will emit.
	 */
	subscribe(
		next?: NextObserver<T>,
		fwd?: (subs: Subscription) => void,
	): Subscription {
		const observer = !next || typeof next === 'function' ? { next } : next;
		return new Subscriber<T>(observer, this.__subscribe, fwd);
	}
}

/**
 * A Subject is an Observable that allows values to be
 * multicasted to many Observers.
 */
export class Subject<T, ErrorT = unknown> extends Observable<T> {
	protected observers = new Set<Subscriber<T>>();

	protected onSubscribe(subscriber: Subscriber<T>): UnsubscribeFunction {
		if (this.isStopped) {
			subscriber.complete();
			return () => undefined;
		}

		this.observers.add(subscriber);
		return () => this.observers.delete(subscriber);
	}

	protected isStopped = false;

	constructor() {
		super((subscription: Subscriber<T>) => this.onSubscribe(subscription));
	}

	next(a: T): void {
		if (!this.isStopped)
			for (const s of Array.from(this.observers))
				if (!s.closed) s.next(a);
	}
	error(e: ErrorT): void {
		if (!this.isStopped) {
			this.isStopped = true;
			let shouldThrow = false,
				lastError;
			for (const s of this.observers)
				try {
					s.error(e);
				} catch (e) {
					shouldThrow = true;
					lastError = e;
					/* noop */
				}
			if (shouldThrow) throw lastError;
		}
	}
	complete(): void {
		if (!this.isStopped) {
			this.isStopped = true;
			Array.from(this.observers).forEach(s => s.complete());
			this.observers.clear();
		}
	}
}

/**
 * A subject that guarantees all subscribers receive the same values in the order they were emitted.
 */
export class OrderedSubject<T> extends Subject<T> {
	private queue: T[] = [];
	private emitting = false;

	next(a: T) {
		if (this.emitting) this.queue.push(a);
		else {
			this.emitting = true;
			super.next(a);
			this.emitting = false;
			if (this.queue.length) this.next(this.queue.shift() as T);
		}
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
		if (!this.isStopped) subscription.next(this.currentValue);
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
export class ReplaySubject<T, ErrorT = unknown> extends Subject<T, ErrorT> {
	private buffer: T[] = [];
	private hasError = false;
	private lastError?: ErrorT;

	constructor(public readonly bufferSize: number = Infinity) {
		super();
	}

	protected onSubscribe(subscriber: Subscriber<T>) {
		this.observers.add(subscriber);

		this.buffer.forEach(val => subscriber.next(val));
		if (this.hasError) subscriber.error(this.lastError as ErrorT);
		else if (this.isStopped) subscriber.complete();

		return () => this.observers.delete(subscriber);
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
	protected $value: T | typeof Undefined = Undefined;

	get hasValue() {
		return this.$value !== Undefined;
	}

	get value(): T {
		if (this.$value === Undefined)
			throw new Error('Reference not initialized');
		return this.$value as T;
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

type ConcatResult<R extends Observable<unknown>[]> = R extends (infer U)[]
	? Observable<Merge<U>>
	: never;
/**
 * Creates an output Observable which sequentially emits all values from given Observable and then moves on to the next.
 */
export function concat<R extends Observable<unknown>[]>(
	...observables: R
): ConcatResult<R> {
	return new Observable(subscriber => {
		let index = 0;
		let lastSubscription: Subscription | undefined;

		function onComplete() {
			const next = observables[index++];
			if (next && !subscriber.closed) {
				if (lastSubscription) lastSubscription.unsubscribe();
				next.subscribe(
					{
						next: subscriber.next.bind(subscriber),
						error: subscriber.error.bind(subscriber),
						complete: onComplete,
					},
					subscription => (lastSubscription = subscription),
				);
			} else subscriber.complete();
		}

		onComplete();
		return () => lastSubscription?.unsubscribe();
	}) as ConcatResult<R>;
}

/**
 * Creates an Observable that, on subscribe, calls an Observable factory to make an Observable for each new Observer.
 */
export function defer<T>(fn: () => Subscribable<T>) {
	return new Observable<T>(subs => {
		const innerSubs = fn().subscribe(subs);
		return () => innerSubs.unsubscribe();
	});
}

export function isInterop<T>(obs: object): obs is InteropObservable<T> {
	return observableSymbol in obs;
}

export function fromArray<T>(input: Array<T>): Observable<T> {
	return new Observable<T>(subs => {
		for (const item of input) if (!subs.closed) subs.next(item);
		subs.complete();
	});
}

export function fromPromise<T>(input: Promise<T>): Observable<T> {
	return new Observable<T>(subs => {
		input
			.then(result => {
				if (!subs.closed) subs.next(result);
				subs.complete();
			})
			.catch(err => subs.error(err));
	});
}

export function fromAsync<T>(input: () => Promise<T>): Observable<T> {
	return defer(() => fromPromise(input()));
}

/**
 * Creates an Observable from an Array, an array-like object, a Promise, an iterable object, or an Observable-like object.
 */
export function from<T>(
	input: Array<T> | Promise<T> | Observable<T> | InteropObservable<T>,
): Observable<T> {
	if (input instanceof Observable) return input;
	if (isInterop(input)) return defer<T>(input[observableSymbol]);
	if (Array.isArray(input)) return fromArray(input);
	return fromPromise(input);
}

/**
 * Converts the arguments to an observable sequence.
 */
export function of<T>(...values: T[]): Observable<T> {
	return fromArray(values);
}

function _toPromise<T, P>(observable: Observable<T, P>) {
	return new Promise<P extends 'emit1' ? T : T | typeof Undefined>(
		(resolve, reject) => {
			let value: typeof Undefined | T = Undefined;
			observable.subscribe({
				next: (val: T) => (value = val),
				error: (e: ObservableError) => reject(e),
				complete: () =>
					resolve(
						value as P extends 'emit1' ? T : T | typeof Undefined,
					),
			});
		},
	);
}

/**
 * Generates a promise from an observable, the promise will resolve when the observable completes.
 */
export function toPromise<T, P>(
	observable: Observable<T, P>,
): Promise<P extends 'emit1' ? T : T | undefined> {
	return _toPromise<T, P>(observable).then(
		r =>
			(r === Undefined ? undefined : r) as P extends 'emit1'
				? T
				: T | undefined,
	);
}

export class EmptyError extends Error {
	message = 'No elements in sequence';
}

export async function firstValueFrom<T>(observable: Observable<T>) {
	return _toPromise(observable.first()) as Promise<T>;
}

export function operatorNext<T, T2 = T>(
	fn: (subs: Subscriber<T2>) => NextFunction<T>,
	unsubscribe?: () => void,
) {
	return (source: Observable<T>) =>
		new Observable<T2>(subscriber => {
			let subscription: Subscription;
			subscriber.setTeardown(() => {
				unsubscribe?.();
				subscription?.unsubscribe();
			});
			source.subscribe(
				{
					next: fn(subscriber),
					error: subscriber.error.bind(subscriber),
					complete: subscriber.complete.bind(subscriber),
				},
				inner => (subscription = inner),
			);
		});
}

export function operator<T, T2 = T>(
	fn: (
		subs: Subscriber<T2>,
		source: Observable<T>,
	) => Observer<T> & {
		next: NextFunction<T>;
		unsubscribe?: UnsubscribeFunction;
	},
): Operator<T, T2> {
	return (source: Observable<T>) =>
		new Observable<T2>(subscriber => {
			let subscription: Subscription;
			const next = fn(subscriber, source);
			subscriber.setTeardown(() => {
				next.unsubscribe?.();
				subscription.unsubscribe();
			});
			if (!next.error) next.error = subscriber.error.bind(subscriber);
			if (!next.complete)
				next.complete = subscriber.complete.bind(subscriber);

			source.subscribe(next, inner => (subscription = inner));
		});
}

/**
 * Applies a given project function to each value emitted by the source Observable, and emits the resulting values as an Observable.
 */
export function map<T, T2>(mapFn: (val: T) => T2) {
	return operatorNext<T, T2>(subscriber => (val: T) => {
		subscriber.next(mapFn(val));
	});
}

/**
 * Applies an accumulator function over the source Observable, and returns the accumulated result when the source completes, given an optional seed value.
 */
export function reduce<T, T2>(
	reduceFn: (acc: T2, val: T, i: number) => T2,
	seed: T2,
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

export function debounceFunction<F extends (...args: any) => any>(
	fn: F,
	delay?: number,
) {
	/*eslint prefer-rest-params: off*/
	let to: number;
	const result = function (this: unknown) {
		if (to) clearTimeout(to);
		to = setTimeout(() => {
			fn.apply(this, arguments as unknown as unknown[]);
		}, delay) as unknown as number;
	};

	(result as unknown as { cancel(): void }).cancel = () => clearTimeout(to);

	return result as ((...args: Parameters<F>) => void) & { cancel(): void };
}

export function interval(period: number) {
	return new Observable<void>(subscriber => {
		const to = setInterval(subscriber.next.bind(subscriber), period);
		return () => clearInterval(to);
	});
}

export function timer(delay: number) {
	return new Observable<void>(subscriber => {
		const to = setTimeout(() => {
			subscriber.next();
			subscriber.complete();
		}, delay);
		return () => clearTimeout(to);
	});
}

/**
 * Emits a value from the source Observable only after a particular time span has passed without another source emission.
 */
export function debounceTime<T>(time = 0, useTimer = timer) {
	return operator<T>(subscriber => {
		let inner: Subscription | undefined,
			completed = false;
		return {
			next(val: T) {
				inner?.unsubscribe();
				inner = useTimer(time).subscribe(() => {
					inner = undefined;
					subscriber.next(val);
					if (completed) subscriber.complete();
				});
			},
			complete() {
				if (inner) completed = true;
				else subscriber.complete();
			},
			unsubscribe: () => inner?.unsubscribe(),
		};
	});
}

/**
 * Projects each source value to an Observable which is merged in the output Observable,
 * emitting values only from the most recently projected Observable.
 */
export function switchMap<T, T2>(project: (val: T) => Observable<T2>) {
	return (source: Observable<T>) =>
		observable<T2>(subscriber => {
			let lastSubscription: Subscription | undefined;
			let completed = false;
			const cleanUp = () => {
				lastSubscription?.unsubscribe();
				lastSubscription = undefined;
				if (completed) subscriber.complete();
			};

			source.subscribe(
				{
					next(val: T) {
						cleanUp();
						const newObservable = project(val);
						newObservable.subscribe(
							{
								next: subscriber.next.bind(subscriber),
								error: subscriber.error.bind(subscriber),
								complete: cleanUp,
							},
							subscription => (lastSubscription = subscription),
						);
					},
					error: subscriber.error.bind(subscriber),
					complete() {
						completed = true;
						if (!lastSubscription) subscriber.complete();
					},
				},
				sourceSubs =>
					subscriber.setTeardown(() => {
						cleanUp();
						sourceSubs.unsubscribe();
					}),
			);
		});
}

/**
 * Projects each source value to an Observable which is merged in the output Observable.
 */
export function mergeMap<T, T2>(project: (val: T) => Observable<T2>) {
	return (source: Observable<T>) =>
		observable<T2>(subscriber => {
			const subscriptions: Subscription[] = [];
			let count = 0;
			let completed = 0;
			let sourceCompleted = false;

			function cleanUp() {
				subscriptions.forEach(s => s.unsubscribe());
			}

			subscriptions.push(
				source.subscribe({
					next: (val: T) => {
						count++;
						subscriptions.push(
							project(val).subscribe({
								next: val => subscriber.next(val),
								error: e => {
									subscriber.error(e);
									cleanUp();
								},
								complete: () => {
									completed++;
									if (
										sourceCompleted &&
										completed === count
									) {
										subscriber.complete();
										cleanUp();
									}
								},
							}),
						);
					},
					error: subscriber.error.bind(subscriber),
					complete() {
						sourceCompleted = true;
						if (completed === count) {
							subscriber.complete();
							cleanUp();
						}
					},
				}),
			);
			return cleanUp;
		});
}

/**
 * Projects each source value to an Observable which is merged in the output Observable
 * only if the previous projected Observable has completed.
 */
export function exhaustMap<T, T2>(project: (value: T) => Observable<T2>) {
	return operator<T, T2>(subscriber => {
		let lastSubscription: Subscription | undefined;

		function unsubscribe() {
			lastSubscription?.unsubscribe();
			lastSubscription = undefined;
		}

		return {
			next(val: T) {
				if (!lastSubscription)
					lastSubscription = project(val).subscribe({
						next: subscriber.next.bind(subscriber),
						error: subscriber.error.bind(subscriber),
						complete: unsubscribe,
					});
			},
			unsubscribe,
		};
	});
}

/**
 * Filter items emitted by the source Observable.
 *
 * @see distinctUntilChanged
 */
export function filter<T>(fn: (val: T) => boolean): Operator<T, T> {
	return operatorNext((subscriber: Subscriber<T>) => (val: T) => {
		if (fn(val)) subscriber.next(val);
	});
}

/**
 * Emits only the first count values emitted by the source Observable.
 */
export function take<T>(howMany: number) {
	return operatorNext((subs: Subscriber<T>) => (val: T) => {
		if (howMany-- > 0 && !subs.closed) subs.next(val);
		if (howMany <= 0 || subs.closed) subs.complete();
	});
}

/**
 * Emits values while fn result is truthy.
 */
export function takeWhile<T>(fn: (val: T) => boolean) {
	return operatorNext((subs: Subscriber<T>) => (val: T) => {
		if (!subs.closed && fn(val)) subs.next(val);
		else subs.complete();
	});
}

/**
 * Emits only the first value emitted by the source Observable.
 * Delivers an EmptyError to the Observer's error callback if the Observable completes before any next notification was sent
 */
export function first<T>() {
	return operator<T, T>(subs => ({
		next(val: T) {
			subs.next(val);
			subs.complete();
		},
		complete() {
			if (!subs.closed) subs.error(new EmptyError());
		},
	}));
}

/**
 * Perform a side effect for every emission on the source Observable,
 * but return an Observable that is identical to the source.
 */
export function tap<T>(fn: (val: T) => void): Operator<T, T> {
	return operatorNext<T, T>((subscriber: Subscriber<T>) => (val: T) => {
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
export function catchError<T, O extends T | never>(
	selector: (err: unknown, source: Observable<T>) => Observable<O> | void,
): Operator<T, T> {
	return operator<T, T>((subscriber, source) => {
		let retrySubs: Subscription | undefined;
		const observer = {
			next: subscriber.next.bind(subscriber) as NextFunction<T>,
			error(err: unknown) {
				try {
					if (subscriber.closed) return;
					const result = selector(err, source);
					if (result) {
						retrySubs?.unsubscribe();
						result.subscribe(observer, subs => (retrySubs = subs));
					}
				} catch (err2) {
					return subscriber.error(err2);
				}
			},
			unsubscribe() {
				retrySubs?.unsubscribe();
			},
		};
		return observer;
	});
}

const initialDistinct = {};

/**
 * Returns an Observable that emits all items emitted by the source Observable
 * that are distinct by comparison from the previous item.
 */
export function distinctUntilChanged<T>(): Operator<T, T> {
	return operatorNext((subscriber: Subscriber<T>) => {
		let lastValue: T | typeof initialDistinct = initialDistinct;
		return (val: T) => {
			if (val !== lastValue) {
				lastValue = val;
				subscriber.next(val);
			}
		};
	});
}

export function select<StateT, K extends keyof StateT>(key: K) {
	return map<StateT, StateT[K]>(state => state[key]);
}

export function share<T>(): Operator<T, T> {
	return (source: Observable<T>) => {
		const subject = ref<T>();
		let subscriptionCount = 0;
		let sourceSubscription: Subscription | undefined;

		return observable<T>(subs => {
			subscriptionCount++;
			const subscription = subject.subscribe(subs);
			if (!sourceSubscription)
				sourceSubscription = source.subscribe(subject);

			return () => {
				subscription.unsubscribe();
				if (--subscriptionCount === 0 && sourceSubscription) {
					sourceSubscription.unsubscribe();
					sourceSubscription = undefined;
				}
			};
		});
	};
}

/**
 * Returns an observable that shares a single subscription to the underlying sequence containing only the last notification.
 */
export function publishLast<T>(): Operator<T, T> {
	return (source: Observable<T>) => {
		const subject = new Subject<T>();
		let sourceSubscription: Subscription;
		let lastValue: T;
		let hasEmitted = false;
		let ready = false;

		return observable<T>(subs => {
			let subjectSubscription: Subscription;
			if (ready) {
				subs.next(lastValue);
				subs.complete();
			} else subjectSubscription = subject.subscribe(subs);

			if (!sourceSubscription)
				sourceSubscription = source.subscribe({
					next: val => {
						hasEmitted = true;
						lastValue = val;
					},
					error: subs.error.bind(subs),
					complete: () => {
						ready = true;
						if (hasEmitted) subject.next(lastValue);
						subject.complete();
					},
				});

			return () => subjectSubscription?.unsubscribe();
		});
	};
}

type MergeResult<R extends Observable<unknown>[]> = R extends (infer U)[]
	? Observable<Merge<U>>
	: never;
/**
 * Creates an output Observable which concurrently emits all values from every given input Observable.
 */
export function merge<R extends Observable<unknown>[]>(
	...observables: R
): MergeResult<R> {
	if (observables.length === 1) return observables[0] as MergeResult<R>;

	return new Observable(subs => {
		let refCount = observables.length;
		const subscriptions: Subscription[] = [];
		for (const o of observables)
			if (!subs.closed)
				o.subscribe(
					{
						next: subs.next.bind(subs),
						error: subs.error.bind(subs),
						complete() {
							if (refCount-- === 1) subs.complete();
						},
					},
					subscription => subscriptions.push(subscription),
				);

		return () => subscriptions.forEach(s => s.unsubscribe());
	}) as MergeResult<R>;
}

/**
 * Combines multiple Observables to create an Observable whose values are calculated from the values, in order, of each of its input Observables.
 */
export function zip<T extends Observable<unknown>[]>(
	...observables: T
): Observable<PickObservable<T>> {
	return observables.length === 0
		? EMPTY
		: (new Observable<unknown>(subs => {
				const buffer: unknown[][] = new Array(observables.length);
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
					const bucket: unknown[] = (buffer[id] = []);
					subscriptions.push(
						o.subscribe({
							next(val) {
								bucket.push(val);
								flush();
							},
							error: subs.error.bind(subs),
							complete() {
								completed++;
								flush();
							},
						}),
					);
				});

				return () => subscriptions.forEach(s => s.unsubscribe());
		  }) as Observable<PickObservable<T>>);
}

/**
 * Combines multiple Observables to create an Observable whose values are calculated from the
 * latest values of each of its input Observables.
 */
export function combineLatest<T extends Observable<unknown>[]>(
	...observables: T
): Observable<PickObservable<T>> {
	return observables.length === 0
		? EMPTY
		: new Observable<PickObservable<T>>(subs => {
				let len = observables.length;
				const initialLen = len;
				let emittedCount = 0;
				let ready = false;
				const emitted: boolean[] = new Array(len);
				const last = new Array(len);

				const subscriptions = observables.map((o, id) =>
					o.subscribe({
						next(val) {
							last[id] = val;
							if (!emitted[id]) {
								emitted[id] = true;
								if (++emittedCount >= initialLen) ready = true;
							}
							if (ready)
								subs.next(last.slice(0) as PickObservable<T>);
						},
						error: subs.error.bind(subs),
						complete() {
							if (--len <= 0) subs.complete();
						},
					}),
				);

				return () => subscriptions.forEach(s => s.unsubscribe());
		  });
}

/**
 * Returns an Observable that mirrors the source Observable, but will call a
 * specified function when the source terminates on complete or error.
 */
export function finalize<T>(unsubscribe: () => void): Operator<T, T> {
	return operator<T, T>((subscriber: Subscriber<T>) => ({
		next: subscriber.next.bind(subscriber),
		// error: subscriber.error.bind(subscriber),
		// complete: subscriber.complete.bind(subscriber),
		unsubscribe,
	}));
}

export function ignoreElements() {
	return filter<never>(() => false);
}

/**
 * Creates an Observable that emits no items to the Observer and immediately emits an error notification.
 */
export function throwError(error: unknown) {
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

export const operators = {
	catchError,
	debounceTime,
	distinctUntilChanged,
	exhaustMap,
	filter,
	finalize,
	first,
	ignoreElements,
	map,
	mergeMap,
	publishLast,
	reduce,
	select,
	share,
	switchMap,
	take,
	takeWhile,
	tap,
} as const;

for (const p in operators) {
	/*eslint @typescript-eslint/no-explicit-any: off */
	Observable.prototype[p as keyof typeof operators] = function (
		this: Observable<unknown>,
		...args: unknown[]
	) {
		return this.pipe((operators as any)[p](...args));
	} as any;
}

export interface Observable<T> {
	catchError<T2 extends T | never>(
		selector: (
			err: unknown,
			source: Observable<T>,
		) => Observable<T2> | void,
	): Observable<T>;
	debounceTime(
		time?: number,
		timer?: (delay: number) => Observable<void>,
	): Observable<T>;
	distinctUntilChanged(): Observable<T>;
	exhaustMap<T2>(project: (value: T) => Observable<T2>): Observable<T2>;
	filter<T2 = T>(fn: (val: T) => boolean): Observable<T2>;
	finalize(fn: () => void): Observable<T>;
	first(): Observable<T>;
	map<T2>(mapFn: (val: T) => T2): Observable<T2>;
	mergeMap<T2>(project: (val: T) => Observable<T2>): Observable<T2>;
	publishLast(): Observable<T>;
	reduce<T2>(
		reduceFn: (acc: T2, val: T, i: number) => T2,
		seed: T2,
	): Observable<T2>;
	select<K extends keyof T>(key: K): Observable<T[K]>;
	share(): Observable<T>;
	switchMap<T2>(project: (val: T) => Observable<T2>): Observable<T2>;
	take(howMany: number): Observable<T>;
	takeWhile(fn: (val: T) => boolean): Observable<T>;
	tap(tapFn: (val: T) => void): Observable<T>;
	ignoreElements(): Observable<never>;
}

export interface InsertEvent<T, K> {
	type: 'insert';
	item: T;
	key: K;
}

export interface RemoveEvent<K> {
	type: 'remove';
	key: K;
}

export interface EmptyEvent {
	type: 'empty';
}

export type ListEvent<T, K> = InsertEvent<T, K> | RemoveEvent<K> | EmptyEvent;
