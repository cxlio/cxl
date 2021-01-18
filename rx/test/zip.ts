import { cold, expectLog } from './util';
import { zip } from '../index';
import { spec } from '@cxl/spec';

export default spec('zip', it => {
	it.should('combine a source with a second', a => {
		const a1 = cold('---1---2---3---');
		const asubs = '^';
		const b1 = cold('--4--5--6--7--8--');
		const bsubs = '^';
		const expected = '---14---25---36';

		expectLog(a, zip(a1, b1), expected);
		a.equal(a1.subscriptions, asubs);
		a.equal(b1.subscriptions, bsubs);
	});
});
