import { spec } from '../spec/index.js';
import { build } from './index.js';

export default spec('build', s => {
	s.test('should load', a => {
		a.ok(build);
	});
});
