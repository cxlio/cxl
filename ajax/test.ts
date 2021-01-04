import { spec } from '@cxl/spec';
import { get } from './index.js';

export default spec('ajax', s => {
	s.test('should load', a => {
		a.ok(get);
	});
});
