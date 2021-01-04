import { spec } from '@cxl/spec';
import { Icon } from './index.js';

export default spec('ui-fa', s => {
	s.test('should load', a => {
		a.ok(Icon);
	});
});
