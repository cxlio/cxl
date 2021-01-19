import { spec } from '@cxl/spec';
import { indexToPosition } from './index.js';

export default spec('source', a => {
	a.test('Should load', a => {
		a.ok(indexToPosition);
	});
});
