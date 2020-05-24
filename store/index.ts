import {
	Observable,
	Subscription,
	Subject,
	map,
	distinctUntilChanged,
} from '../rx/index.js';

export interface CollectionEvent<T> {
	type: 'start' | 'item' | 'complete';
	value: T;
}

export class Entity<T> extends Observable<T> {
	private selectors: any = {};

	constructor(protected value?: T) {
		super(subs => {
			if (value !== undefined) subs.next(value);
		});
	}

	select<K extends keyof T>(key: K): Observable<T[K]> {
		return (
			this.selectors[key] ||
			(this.selectors[key] = this.pipe(
				map(state => state[key]),
				distinctUntilChanged()
			))
		);
	}
}

export class Collection<T, EntityT = Entity<T>> extends Observable<EntityT> {}

/*export class Reference<T> extends Subject<T> {
	protected selectors: any = {};

	constructor(protected state?: T) {
		super();
	}

	protected onSubscribe(subscription: Subscription<T>) {
		if (this.state !== undefined) subscription.next(this.state);
		return super.onSubscribe(subscription);
	}

	select<K extends keyof T>(key: K): Observable<T[K]> {
		return (
			this.selectors[key] ||
			(this.selectors[key] = this.pipe(
				map(state => state[key]),
				distinctUntilChanged()
			))
		);
	}
}*/

export class Store<StateT> extends Subject<StateT> {
	protected selectors: any = {};

	constructor(protected state?: StateT) {
		super();
	}

	protected onSubscribe(subscription: Subscription<StateT>) {
		if (this.state !== undefined) subscription.next(this.state);
		return super.onSubscribe(subscription);
	}

	next(val: StateT) {
		this.state = val;
		super.next(val);
	}

	select<K extends keyof StateT>(key: K): Observable<StateT[K]> {
		return (
			this.selectors[key] ||
			(this.selectors[key] = this.pipe(
				map(state => state[key]),
				distinctUntilChanged()
			))
		);
	}
}

interface SelectFn<StateT> {
	<K extends keyof StateT>(key: K): Observable<StateT[K]>;
	next(state: StateT): void;
}

export function select<StateT, K extends keyof StateT>(key: K) {
	return map<StateT, StateT[K]>(state => state[key]);
}

export function store<StateT>(state?: StateT) {
	const store = new Store(state);
	const select = store.select.bind(store);
	(select as any).next = store.next.bind(store);
	return select as SelectFn<StateT>;
}

/*export class GlobalStore<State, K extends keyof State = keyof State> {
	public state = { ...this.initialState };

	protected subject = new BehaviorSubject(this.state);
	protected stores: any = {};
	protected selectors: any = {};

	constructor(protected initialState: State) {}

	forFeature(featureKey: K, initialState: State[K] = this.state[featureKey]) {
		return (
			this.stores[featureKey] ||
			(this.stores[featureKey] = new Store(initialState))
		);
	}

	select(key: K): Observable<State[K]> {
		return (
			this.selectors[key] ||
			(this.selectors[key] = this.subject.pipe(
				map(state => state[key]),
				distinctUntilChanged()
			))
		);
	}

	reset(key?: K) {
		if (key) this.set(key, this.initialState[key]);
		else this.subject.next(this.initialState);
	}

	set(key: K, value: State[K]) {
		this.state[key] = value;
		this.subject.next(this.state);
	}
}

/*export type Reducer<T> = (state: T, action: any) => T;
export type Action<T> = (state: T) => T;

export class Store<State, K extends keyof State = keyof State> {

	protected subject = new BehaviorSubject(this.state);
	protected initialState = { ...this.state };
	constructor(public state: State) {}
	
	reducers: Reducer<State>[] = [
		(state: State, action: SetAction) => {
			if (action.type === 'set') {
				state[action.key as K] = action.value;
			}
			return state;
		}
	];
	
	set(key: K, value: State[K]) {
		this.dispatch(new SetAction(key as string, value));
	}

	dispatch(action: Action) {
		const newState = this.reducers.reduce((state, reducer) => {
			return reducer(state, action);
		}, this.state);

		this.subject.next(newState);
	}
}
*/
