import {
	BehaviorSubject,
	Observable,
	map,
	distinctUntilChanged
} from '@cxl/rx';

export interface Action {
	type: string;
}

export class SetAction implements Action {
	type = 'set';

	constructor(public key: string, public value: any) {}
}

export class StoreBase<State> {
	protected subject = new BehaviorSubject();
	constructor(public state: State) {}

	select<K extends keyof State>(key: K): Observable<State[K]>;
	select<K extends keyof State, K2 extends keyof State[K]>(
		key: K,
		key2: K2
	): Observable<State[K][K2]>;
	select<
		K extends keyof State,
		K2 extends keyof State[K],
		K3 extends keyof State[K][K2]
	>(key: K, key2: K2, key3: K3): Observable<State[K][K2][K3]>;
	select(...keys: string[]) {
		return this.subject.pipe(
			map(
				(state: State): any =>
					keys.reduce((result, key) => result && result[key], state)
			),
			distinctUntilChanged()
		);
	}
}

export class Store<State> extends StoreBase<State> {
	reducers: [(state: State, action: any) => State];

	constructor(public state: State) {
		super(state);
		this.reducers = [
			function<K extends keyof State>(state: State, action: SetAction) {
				if (action.type === 'set') {
					state[action.key as K] = action.value;
				}
				return state;
			}
		];
	}

	set<K extends keyof State>(key: K, value: State[K]) {
		this.dispatch(new SetAction(key as string, value));
	}

	dispatch(action: Action) {
		const newState = this.reducers.reduce((state, reducer) => {
			return reducer(state, action);
		}, this.state);

		this.subject.next(newState);
	}
}
