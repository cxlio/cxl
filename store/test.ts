import { Store } from './index';
import * as assert from 'assert';

assert.ok(Store);

function Persist() {
	return (target: any, prop: any) => {
		target[prop] = 'persist';
	};
}

class State {
	key: number = 0;

	@Persist()
	key2?: string;
}

const initialState = new State();
const store = new Store(initialState);

assert.equal(store.state.key2, 'persist');
assert.equal(store.state.key, 0);

store.set('key', 2);
store.set('key2', 'hello');

assert.equal(store.state.key, 2);
assert.equal(store.state.key2, 'hello');

store.select('key').subscribe((val: number) => assert.equal(val, 2));
store.select('key2').subscribe((val: string) => assert.equal(val, 'hello'));
