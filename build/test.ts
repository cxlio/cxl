import { spec } from '@cxl/spec';
import { build } from './index.js';

export default spec('build', s => {
	s.test('should load', a => {
		a.ok(build);
	});
});
