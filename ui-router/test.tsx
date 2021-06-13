import { spec } from '@cxl/spec';
import { RouterItem, router } from './index.js';

export default spec('ui-router', s => {
	s.test('should load', a => {
		a.ok(router);
	});

	s.test('RouterItem', it => {
		it.should('implement a focus method', a => {
			const el = a.element('cxl-router-item') as RouterItem;
			el.focus();
			a.ok(el.matches(':focus-within'));
		});
	});
});
