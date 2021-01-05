import { spec } from '@cxl/spec';
import { Calendar } from './index.js';

export default spec('ui-datetime', s => {
	s.test('should load', a => {
		a.ok(Calendar);
	});
});
