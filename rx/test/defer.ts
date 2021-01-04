import { cold, expectLog } from './util';
import { defer } from '../index';
import { suite } from '@cxl/spec';

export default suite('defer', test => {
	test('should defer the creation of a simple observable', a => {
		const expected = '-a--b--c--|';
		const e1 = defer(() => cold('-a--b--c--|'));
		// Run Again
		expectLog(a, e1, expected);
	});
});
