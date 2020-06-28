import { cold, expectLog } from './util';
import { filter } from '../index';
import { suite } from '../../spec/index.js';

export default suite('filter', test => {
	test('should filter out event values', a => {
		const source = cold('--0--1--2--3--4--|');
		const subs = '^                 !';
		const expected = '-----1-----3-----|';

		expectLog(a, source.pipe(filter(x => +x % 2 === 1)), expected);
		a.equal(source.subscriptions, subs);
	});
});
