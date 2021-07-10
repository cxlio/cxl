import { spec } from '@cxl/spec';

export default spec('runner', s => {
	s.test('should load', a => {
		a.ok(spec);
	});
});
