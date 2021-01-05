import { spec } from '@cxl/spec';
import { RouterComponent } from './index.js';

export default spec('ui-router', s => {
	s.test('should load', a => {
		a.ok(RouterComponent);
	});
});
