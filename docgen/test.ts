import { spec } from '@cxl/spec';
import { render } from './render-json.js';

export default spec('drag', s => {
	s.test('dragInside', a => {
		a.ok(render);
	});
});
