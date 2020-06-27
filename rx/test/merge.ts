import { cold, expectLog } from './util';
import { merge, of } from '../index';
import { suite } from '../../spec';

export default suite('merge', test => {
	test('should return itself when try to merge single observable', a => {
		const e1 = of('a');
		const result = merge(e1);

		a.equal(e1, result);
	});

	test('should merge different types', a => {
		const e1 = of(1);
		const e2 = of('2');

		a.ok(merge(e1, e2));
	});

	test('should merge cold and cold', a => {
		const e1 = cold('---a-----b-----c----|');
		const e2 = cold('------x-----y-----z----|');
		const expected = '---a--x--b--y--c--z----|';

		expectLog(a, merge(e1, e2), expected);
	});

	test('should merge empty and empty', a => {
		const e1 = cold('|');
		const e2 = cold('|');

		expectLog(a, merge(e1, e2), '|');
	});

	test('should merge parallel emissions', a => {
		const e1 = cold('---a----b----c----|');
		const e2 = cold('---x----y----z----|');
		const expected = '---(ax)----(by)----(cz)----|';

		expectLog(a, merge(e1, e2), expected);
	});

	test('should merge empty and throw', a => {
		const e1 = cold('|');
		const e2 = cold('#');

		expectLog(a, merge(e1, e2), '#');
	});
});
