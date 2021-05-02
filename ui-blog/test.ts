import { spec } from '@cxl/spec';
import { BlogDemo } from './index.js';

export default spec('ui-blog', s => {
	s.test('should load', a => {
		a.ok(BlogDemo);
	});
});
