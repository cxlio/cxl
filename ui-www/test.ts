import { spec } from '@cxl/spec';
import { Icons } from './index.js';

export default spec('ui-www', s => {
	s.test('should load', a => {
		a.ok(Icons);
	});
});
