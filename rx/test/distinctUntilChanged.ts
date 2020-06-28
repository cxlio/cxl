import { cold, expectLog } from './util';
import { distinctUntilChanged } from '../index';
import { suite } from '../../spec/index.js';

export default suite('distinctUntilChanged', test => {
	test('should distinguish between values', a => {
		const e1 = cold('-1--2-2----1-3-|');
		const expected = '-1--2------1-3-|';

		expectLog(a, e1.pipe(distinctUntilChanged()), expected);
	});
});
