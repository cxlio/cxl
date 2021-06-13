import { spec } from '@cxl/spec';
import { Svg } from './index.js';

export default spec('tsx-svg', s => {
	s.test('should load', a => {
		a.ok(Svg);
	});
});
