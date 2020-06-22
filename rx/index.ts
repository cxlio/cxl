type ObservableError = any;
type NextFunction<T> = (val: T) => void;
type ErrorFunction = (err: ObservableError) => void;
type CompleteFunction = () => void;
type UnsubscribeFunction = () => void;
type SubscribeFunction<T> = (
	subscription: Subscription<T>
) => UnsubscribeFunction | void;
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

// Used for observable interoperability
const observableSymbol = (Symbol as any).observable || '@@observable';

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

export class Observable<T> {
	[observableSymbol]() {
		return this;
	}
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
}

/**
 * A Subject is an Observable that allows values to be
 * multicasted to many Observers.
 */
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
	constructor(private currentValue: T) {
		super();
	}

	get value() {
		return this.currentValue;
	}

	protected onSubscribe(subscription: Subscription<T>) {
		subscription.next(this.currentValue);
		return super.onSubscribe(subscription);
	}

	next(val: T) {
		this.currentValue = val;
		super.next(val);
	}
}

export class ReplaySubject<T> extends Subject<T> {
	private buffer: T[] = [];
	constructor(public readonly bufferSize: number) {
		super();
	}

	protected onSubscribe(subscription: Subscription<T>) {
		this.buffer.forEach(val => subscription.next(val));
		return super.onSubscribe(subscription);
	}

	next(val: T) {
		if (this.buffer.length === this.bufferSize) this.buffer.shift();

		this.buffer.push(val);
		return super.next(val);
	}
}

const Undefined = {};

export class Reference<T> extends Subject<T> {
	private value: T | typeof Undefined = Undefined;
	protected onSubscribe(subscription: Subscription<T>) {
		if (this.value !== Undefined) subscription.next(this.value as T);
		return super.onSubscribe(subscription);
	}

	next(val: T) {
		this.value = val;
		return super.next(val);
	}
}

function concat<R extends Observable<any>[]>(
	...observables: R
): R extends (infer U)[] ? Observable<Merge<U>> : never {
	return new Observable(subscriber => {
		let subscription: Subscription<any>;
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
function cleanUpSubscriber<T, T2>(
	next: NextFunction<T>,
	subscriber: Subscription<T2>,
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

export function map<T, T2>(mapFn: (val: T) => T2) {
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

export function debounceTime<T>(time?: number) {
	return operator<T>(subscriber =>
		debounceFunction(subscriber.next.bind(subscriber), time)
	);
}

export function switchMap<T, T2>(project: (val: T) => Observable<T2>) {
	let lastSubscription: Subscription<T2>;

	return operator<T, T2>(subscriber => (val: T) => {
		if (lastSubscription) lastSubscription.unsubscribe();

		const newObservable = project(val);
		lastSubscription = newObservable.subscribe(val => subscriber.next(val));
	});
}

export function mergeMap<T, T2>(project: (val: T) => Observable<T2>) {
	let subscriptions: Subscription<T2>[] = [];

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

export function exhaustMap<T, T2>(project: (value?: T) => Observable<T2>) {
	let lastSubscription: Subscription<T2> | null;

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
function filter<T>(fn: (val: T) => boolean): Operator<T, T> {
	return operator((subscriber: Subscription<T>) => (val: T) => {
		if (fn(val)) subscriber.next(val);
	});
}

export function tap<T>(fn: (val: T) => void): Operator<T, T> {
	return operator<T, T>((subscriber: Subscription<T>) => (val: T) => {
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
export function catchError<T, T2>(
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

export function distinctUntilChanged<T>(): Operator<T, T> {
	return operator((subscriber: Subscription<T>) => {
		let lastValue: T | typeof initialDistinct = initialDistinct;
		return (val: T) => {
			if (val !== lastValue) {
				lastValue = val;
				subscriber.next(val);
			}
		};
	});
}

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

const operators: any = {
	map,
	tap,
	filter,
	debounceTime,
	distinctUntilChanged,
	mergeMap,
	switchMap,
	catchError,
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
	defer(fn: () => Observable<T> | void): Observable<T>;
	distinctUntilChanged(): Observable<T>;
	filter(fn: (val: T) => boolean): Observable<T>;
	map<T2>(mapFn: (val: T) => T2): Observable<T2>;
	mergeMap<T2>(project: (val: T) => Observable<T2>): Observable<T2>;
	switchMap<T2>(project: (val: T) => Observable<T2>): Observable<T2>;
	tap(tapFn: (val: T) => void): Observable<T>;
}

export {
	BehaviorSubject,
	Subject,
	Subscriber,
	from,
	toPromise,
	throwError,
	filter,
	concat,
	combineLatest,
	of,
};
