import { spec } from '../spec/index.js';
import { render } from './render-json.js';

export default spec('drag', s => {
	s.test('dragInside', a => {
		a.ok(render);
	});
});
