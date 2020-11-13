import { collection, db } from './index.js';
import { suite, Test } from '../spec/index.js';
import * as firebase from 'firebase';

interface Schema {
	test: {
		collection: Record<string, string>;
		module: string;
		variable: string;
	};
}

export default suite('db', test => {
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
		const ref = db<string>('fb/test/module');
		a.equal(ref.path, 'fb/test/module');
		ref.first().subscribe(val => {
			a.equal(val, 'fb');
			done();
		});
	});

	test('variable', async (a: Test) => {
		const db$ = db<Schema>('fb');
		const ref = db$.ref('test').ref('variable');
		let newVal = `test-${a.id}`;
		await ref.next(newVal);
		let val = await ref;
		a.equal(val, newVal);
		await ref.next((newVal += newVal));
		val = await ref;
		a.equal(val, newVal);
	});

	test('collection - initial subscription', (a: Test) => {
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
});
