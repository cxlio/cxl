import { cold, expectLog } from './util';
import { combineLatest } from '../index';
import { suite } from '../../spec/index.js';

export default suite('combineLatest', test => {
	test('should combine events from two observables', async a => {
		const e1 = cold('-a-b-c-|');
		const e2 = cold('---1-|');
		const e3 = cold('-x|');
		const expected = '---b,1,x-c,1,x-|';

		await expectLog(a, combineLatest(e1, e2, e3), expected);
		a.equal(e1.subscriptions, '^       !');
		a.equal(e2.subscriptions, '^     !');
		a.equal(e3.subscriptions, '^  !');
	});

	test("should work with two EMPTY's", async a => {
		const e1 = cold('|');
		const e2 = cold('|');

		await expectLog(a, combineLatest(e1, e2), '|');
		a.equal(e1.subscriptions, '^!');
		a.equal(e2.subscriptions, '^!');
	});
});
