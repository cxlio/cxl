import { suite } from '../../tester';
import { cold, expectLog } from './util';
import { concat } from '../index';

export default suite('concat', test => {
	test('should emit elements from multiple sources', a => {
		const e1 = cold('-a-b-c-|');
		const e1subs = '^       !';
		const e2 = cold('-0-1-|');
		const e2subs = '       ^    !';
		const e3 = cold('-w-x-y-z-|');
		const e3subs = '            ^        !';
		const expected = '-a-b-c--0-1--w-x-y-z-|';

		expectLog(a, concat(e1, e2, e3), expected);
		a.equal(e1.subscriptions, e1subs);
		a.equal(e2.subscriptions, e2subs);
		a.equal(e3.subscriptions, e3subs);
	});
});
