import { cold, expectLog } from './util';
import { concat } from '../index';
import { spec } from '@cxl/spec';

export default spec('concat', it => {
	it.should(' emit elements from multiple sources', a => {
		const e1 = cold('-a-b-c-|');
		const e1subs = '^      !';
		const e2 = cold('-0-1-|');
		const e2subs = '       ^    !';
		const e3 = cold('-w-x-y-z-|');
		const e3subs = '            ^        !';
		const expected = '-a-b-c--0-1--w-x-y-z-|';

		const obs = concat(e1, e2, e3);

		expectLog(a, obs, expected);
		a.equal(e1.subscriptions, e1subs);
		a.equal(e2.subscriptions, e2subs);
		a.equal(e3.subscriptions, e3subs);

		// Run Again
		expectLog(a, obs, expected);
	});

	it.should('concat the same cold observable multiple times', a => {
		const inner = cold('--i-j-k-l-|');
		const innersubs = '^         (^!)         (^!)         (^!)         !';
		const expected = '--i-j-k-l---i-j-k-l---i-j-k-l---i-j-k-l-|';

		const result = concat(inner, inner, inner, inner);

		expectLog(a, result, expected);
		a.equal(inner.subscriptions, innersubs);
	});

	it.should('not complete if first source does not completes', a => {
		const e1 = cold('-');
		const e1subs = '^';
		const e2 = cold('--|');
		const e2subs = '';
		const expected = '-';

		expectLog(a, concat(e1, e2), expected);
		a.equal(e1.subscriptions, e1subs);
		a.equal(e2.subscriptions, e2subs);
	});

	it.should(
		'raise error when first source is empty, second source raises error',
		a => {
			const e1 = cold('--|');
			const e1subs = '^ !';
			const e2 = cold('----#');
			const e2subs = '  ^   !';
			const expected = '------#';

			expectLog(a, concat(e1, e2), expected);
			a.equal(e1.subscriptions, e1subs);
			a.equal(e2.subscriptions, e2subs);
		}
	);
});
