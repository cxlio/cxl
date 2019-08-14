import { Subject, Observable, map } from '@cxl/rx';

export interface Action {
	type: string;
}

export class SetAction implements Action {
	type = 'set';

	constructor(public key: string, public value: any) {}
}

export class Store<State> {
	subject = new Subject();
	reducers: [(state: State, action: any) => State];

	constructor(public state: State) {
		this.reducers = [
			function<K extends keyof State>(state: State, action: SetAction) {
				if (action.type === 'set') {
					state[action.key as K] = action.value;
				}
				return state;
			}
		];
	}

	select<K extends keyof State>(key: K): Observable<State[K]> {
		return this.subject.pipe(
			map((state: State): any => state && state[key])
		);
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
