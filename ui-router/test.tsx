import { spec } from '@cxl/spec';
import { RouterItem, router } from './index.js';

export default spec('ui-router', s => {
	s.test('should load', a => {
		a.ok(router);
	});

	s.test('RouterItem', a => {
		const el = a.element('cxl-router-item') as RouterItem;
		a.ok(el);
	});
});
