import firebase from 'firebase';
import { spec, TestApi } from '@cxl/spec';
import { merge } from '@cxl/rx';
import { collection, db } from './index.js';

interface Schema {
	test: {
		collection: Record<string, string>;
		module: string;
		variable: string;
	};
}

export default spec('db', suite => {
	const test = suite.test.bind(suite);
	const config = {
		apiKey: 'AIzaSyAjD_mhMqwRcTRiJ8fYNJteERHdKJaPq-Y',
		databaseURL: 'https://cxl-test.firebaseio.com',
		projectId: 'cxl-test',
		appId: '1:621527952271:web:17942cb9d5c9de81eb79fa',
	};

	firebase.initializeApp(config);

	test('db', a => {
		const ref = db<Schema>('fb');
		a.equal(ref.path, 'fb');
		a.equal(ref.key, '');
		const ref2 = db<any>('fb/test');
		a.equal(ref2.path, 'fb/test');
		a.equal(ref2.key, '');
	});

	test('observe', a => {
		const done = a.async();
		const ref = db<Schema>('fb').ref('test').ref('module');
		let count = 0;
		a.equal(ref.path, 'fb/test/module');
		const subs = merge(ref, ref).subscribe(val => {
			a.equal(val, 'fb');
			if (++count === 2) {
				a.equal(count, 2);
				done();
				subs.unsubscribe();
			}
		});
	});

	test('observe - multiple subscriptions', a => {
		const done = a.async();
		const ref = db<Schema>('fb').ref('test').ref('module');
		const obs = ref.first();
		let count = 0;
		a.equal(ref.path, 'fb/test/module');
		obs.subscribe(val => {
			a.equal(val, 'fb');
			if (++count === 2) done();
		});
		obs.subscribe(val => {
			a.equal(val, 'fb');
			if (++count === 2) done();
		});
	});

	test('variable', async (a: TestApi) => {
		const db$ = db<Schema>('fb');
		const ref = db$.ref('test').ref('variable');
		let newVal = `test-${a.id}`;
		await ref.next(newVal);
		let val = await ref.first();
		a.equal(val, newVal);
		await ref.next((newVal += newVal));
		val = await ref.first();
		a.equal(val, newVal);
	});

	test('collection - initial subscription', (a: TestApi) => {
		const done = a.async();
		const db$ = db<Schema>('fb');
		const ref = db$.ref('test').ref('collection');
		let count = 0;

		const subs = collection(ref).subscribe(ev => {
			if (count === 0) a.equal(ev.type, 'empty');
			else if (count === 1) {
				a.assert(ev.type === 'insert');
				a.equal(ev.item.key, 'first');
			} else if (count === 2) {
				a.assert(ev.type === 'insert');
				a.equal(ev.item.key, 'second');
				subs.unsubscribe();
				done();
			}
			count++;
		});
	});

	suite.afterAll(() => {
		firebase.app().delete();
	});
});
