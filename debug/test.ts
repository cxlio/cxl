import { spec } from '../spec/index.js';
import { override } from './index.js';

export default spec('debug', s => {
	s.test('should load', a => {
		a.ok(override);
	});
});
