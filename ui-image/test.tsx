import { spec } from '@cxl/spec';
import { ImageDiff } from './index.js';

export default spec('ui-image', s => {
	s.test('should load', a => {
		a.ok(ImageDiff);
	});
});
