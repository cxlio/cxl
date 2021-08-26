import { spec } from '@cxl/spec';
import { Regex } from './index.js';

export default spec('ui-ide', s => {
	s.test('should load', a => {
		a.ok(Regex);
	});
});
