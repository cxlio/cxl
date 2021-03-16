import { spec } from '@cxl/spec';
import theme from './index.js';

export default spec('ui-theme-terminal', s => {
	s.test('should load', a => {
		a.ok(theme);
	});
});
