import { spec } from '../spec/index.js';
import { render } from './index.js';

export default spec('css', s => {
	s.test('should render', a => {
		a.ok(render);
	});
});
