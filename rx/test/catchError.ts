import { cold, expectLog } from './util';
import { catchError, of } from '../index';
import { suite } from '../../spec/index.js';

export default suite('catchError', test => {
	test('should catch error and replace with a cold Observable', a => {
		const e1 = cold('--a--b--#       ');
		const e2 = cold('-1-2-3-|');
		const expected = '--a--b---1-2-3-|';

		const result = e1.pipe(catchError((_err: any) => e2));

		expectLog(a, result, expected);
	});

	test('should catch error and replace it with Observable.of()', a => {
		const e1 = cold('--a--b--c--------|');
		const subs = '^        !';
		const expected = '--a--b--(XYZ|)';

		const result = e1
			.map((n: string) => {
				if (n === 'c') {
					throw 'bad';
				}
				return n;
			})
			.catchError((_err: any) => {
				return of('X', 'Y', 'Z');
			});
		expectLog(a, result, expected);
		a.equal(e1.subscriptions, subs);
	});
});
