import { spec } from '../spec/index.js';
import { required } from './index.js';

export default spec('validation', s => {
	s.test('should load', a => {
		a.ok(required);
	});
});
