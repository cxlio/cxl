import { cold, expectLog } from './util';
import { publishLast } from '../index';
import { spec } from '@cxl/spec';

export default spec('publishLast', a => {
	a.should('emit last notification of a simple source Observable', a => {
		const source = cold('--1-2---3-4--5-|');
		const sourceSubs = '^               !';
		const published = source.pipe(publishLast());
		const expected = '---------------(5|)';

		expectLog(a, published, expected);
		a.equal(source.subscriptions, sourceSubs);
	});
});
