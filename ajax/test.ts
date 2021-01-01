import { spec } from '../spec/index.js';
import { get } from './index.js';

export default spec('ajax', s => {
	s.test('should load', a => {
		a.ok(get);
	});
});
