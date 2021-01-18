import { cold, expectLog } from './util';
import { mergeMap } from '../index';
import { spec } from '@cxl/spec';

export default spec('mergeMap', a => {
	a.should('map-and-flatten each item to an Observable', async a => {
		const values = { x: 10, y: 30, z: 50 };
		const e1 = cold('--1-----3--5-------|', values);
		const e1subs = '^                  !';
		const e2 = cold('x-x-x|              ', { x: 10 });
		const expected = '--10-10-10-30-30503050-50---|';
		const result = e1.pipe(mergeMap(x => e2.map(i => +i * +x)));

		await expectLog(a, result, expected);
		a.equal(e1.subscriptions, e1subs);
	});
});
