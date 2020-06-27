import { cold, expectLog } from './util';
import { combineLatest } from '../index';
import { suite } from '../../spec/index.js';

export default suite('combineLatest', test => {
	test('should combine events from two observables', async a => {
		const e1 = cold('-a-b-c-|');
		const e2 = cold('---1-|');
		const e3 = cold('-x|');
		const expected = '-a,0-(b,0b,1)-c,1-|';

		await expectLog(a, combineLatest(e1, e2, e3), expected);
		a.equal(e1.subscriptions, '^       !');
		a.equal(e2.subscriptions, '^     !');
		a.equal(e3.subscriptions, '^   !');
	});
});
