import { cold, expectLog } from './util';
import { concat } from '../index';
import { suite } from '@cxl/spec';

export default suite('concat', test => {
	test('should emit elements from multiple sources', a => {
		const e1 = cold('-a-b-c-|');
		const e1subs = '^      !';
		const e2 = cold('-0-1-|');
		const e2subs = '      ^    !';
		const e3 = cold('-w-x-y-z-|');
		const e3subs = '           ^        !';
		const expected = '-a-b-c--0-1--w-x-y-z-|';

		const obs = concat(e1, e2, e3);

		expectLog(a, obs, expected);
		a.equal(e1.subscriptions, e1subs);
		a.equal(e2.subscriptions, e2subs);
		a.equal(e3.subscriptions, e3subs);

		// Run Again
		expectLog(a, obs, expected);
	});
});
