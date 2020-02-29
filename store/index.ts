import { BehaviorSubject, Observable, map, distinctUntilChanged } from '../rx';

/*export class SetAction implements Action {
	type = 'set';
	constructor(public key: string, public value: any) {}
}*/

export class Store<State, K extends keyof State = keyof State> {
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
