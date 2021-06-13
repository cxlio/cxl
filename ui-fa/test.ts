import { spec } from '@cxl/spec';
import { Icon } from './index.js';

export default spec('ui-fa', s => {
	s.test('should load', a => {
		const el = document.createElement(Icon.tagName) as Icon;
		el.icon = 'wind';
		a.ok(el);
	});
});
