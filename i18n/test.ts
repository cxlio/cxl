import { spec } from '@cxl/spec';
import { registerContent } from './index.js';

export default spec('i18n', s => {
	s.test('should load', a => {
		a.ok(registerContent);
	});
});
