import { spec } from '@cxl/spec';
import { buildBlog } from './index.js';

export default spec('blog', s => {
	s.test('should load', a => {
		a.ok(buildBlog);
	});
});
