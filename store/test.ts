import { Store } from './index';
import { suite } from '../tester';

export default suite('store', test => {
	test('BaseStore', assert => {
		assert.ok(Store);

		function Persist() {
			return (target: any, prop: any) => {
				target[prop] = 'persist';
			};
		}

		class State {
			key = 0;

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

		store.select('key').subscribe(val => assert.equal(val, 2));
		store.select('key2').subscribe(val => assert.equal(val, 'hello'));
	});

	/*test('BaseStore.selectOrLoad', a => {
		const initialState = { hello: '' };
		const store = new Store(initialState);
		let loadTimes = 0;
		let set = 0;
		const load = of('world').pipe(
			tap(val => {
				a.equal(val, 'world');
				loadTimes++;
			})
		);

		const s1 = store.selectOrLoad('hello', load).subscribe(val => {
			a.equal(val, 'world');
			a.equal(loadTimes, 1);
			set += 1;
		});

		a.equal(set, 1);
		a.equal(store.state.hello, 'world');

		const s2 = store.selectOrLoad('hello', load).subscribe(val => {
			a.equal(val, 'world');
			set += 3;
		});

		a.equal((store as any).initialState.hello, '');
		a.equal(loadTimes, 1);
		a.equal(set, 4);
		a.equal(store.state.hello, 'world');

		s1.unsubscribe();
		s2.unsubscribe();
	});

	test('BaseStore.selectOrLoad reset', a => {
		const initialState = { hello: '' };
		const store = new Store(initialState);
		let loadTimes = 0;
		const load = new BehaviorSubject<string>();
		const reset = new Subject<any>();
		const selector = store.selectOrLoad(
			'hello',
			load.pipe(
				tap(val => {
					a.equal(val, 'world');
					loadTimes++;
				})
			),
			reset
		);

		selector
			.subscribe(val => {
				a.equal(val, 'world');
			})
			.unsubscribe();
		const s2 = selector.subscribe(val => {
			a.equal(val, 'world');
		});

		load.next('world');
		a.equal(loadTimes, 1);
		reset.next(1);
		a.equal(loadTimes, 2);
		reset.next(1);
		a.equal(loadTimes, 3);

		s2.unsubscribe();
	});*/
});
