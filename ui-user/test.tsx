import { spec } from '@cxl/spec';
import { UserNavbar } from './index.js';

export default spec('ui-user', s => {
	s.test('should load', a => {
		a.ok(UserNavbar);
	});
});
