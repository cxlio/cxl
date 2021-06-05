import { cold, expectLog } from './util';
import { Observable, share } from '../index';
import { spec } from '@cxl/spec';

export default spec('share', it => {
	it.should('should mirror a simple source Observable', a => {
		const source = cold('--1-2---3-4--5-|');
		const sourceSubs = '^              !';
		const expected = '--1-2---3-4--5-|';
		const shared = source.pipe(share());

		expectLog(a, shared, expected);
		a.equal(source.subscriptions, sourceSubs);
	});

	it.should('share a single subscription', a => {
		let subscriptionCount = 0;
		const obs = new Observable<never>(() => {
			subscriptionCount++;
			return () => subscriptionCount--;
		});

		const source = obs.pipe(share());
		a.equal(subscriptionCount, 0);
		const subscriptions = [source.subscribe(), source.subscribe()];
		a.equal(subscriptionCount, 1);
		subscriptions.forEach(s => s.unsubscribe());
		a.equal(subscriptionCount, 0);
	});

	it.should(
		'not change the output of the observable when error with cold observable',
		a => {
			const e1 = cold('---a--b--c--d--e--#');
			const e1subs = '^                 !';
			const expected = '---a--b--c--d--e--#';

			expectLog(a, e1.pipe(share()), expected);
			a.equal(e1.subscriptions, e1subs);
		}
	);
});
