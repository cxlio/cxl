import { cold, logEvents } from './util';
import { exhaustMap } from '../index';
import { suite } from '../../spec';

export default suite('exhaustMap', test => {
	/*test('should map-and-flatten each item to an Observable', a => {
		const e1 = hot('--1-----3--5-------|');
		const e1subs = '^                  !';
		const e2 = cold('x-x-x|              ', { x: 10 });
		const expected = '--x-x-x-y-y-y------|';
		const values = { x: 10, y: 30, z: 50 };

		const result = e1.pipe(exhaustMap(x => e2.pipe(map(i => i * +x))));

		a.ok(result);
		//result.subscribe(values => {
		// })
		// a.expectObservable(result).toBe(expected, values);
		// expectSubscriptions(e1.subscriptions).toBe(e1subs);
	});*/

	test('should handle outer throw', a => {
		const x = cold('--a--b--c--|');
		const e1 = cold('#');
		logEvents(e1.pipe(exhaustMap(() => x))).then(({ events }) => {
			a.equal(events, '#');
		});
	});

	test('should handle outer empty', a => {
		const x = cold('--a--b--c--|');
		const e1 = cold('|');
		logEvents(e1.pipe(exhaustMap(() => x))).then(result => {
			a.equal(result.events, '|');
		});
	});

	test('should raise error if project throws', a => {
		const e1 = cold('---x|');
		const result = e1.pipe(
			exhaustMap(() => {
				throw 'error';
			})
		);
		logEvents(result).then(({ events }) => {
			a.equal(events, '---#');
		});
	});
});
