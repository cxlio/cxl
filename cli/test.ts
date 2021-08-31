import { spec } from '@cxl/spec';
import cli from './index.js';

export default spec('cli', s => {
	s.test('should load', a => {
		a.ok(cli);
	});
});
