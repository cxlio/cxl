import { spec } from '@cxl/spec';
import { Table } from './index.js';

export default spec('ui-table', s => {
	s.test('should load', a => {
		a.ok(Table);
	});
});
