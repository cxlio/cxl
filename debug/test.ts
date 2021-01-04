import { spec } from '@cxl/spec';
import { override } from './index.js';

export default spec('debug', s => {
	s.test('should load', a => {
		a.ok(override);
	});
});
