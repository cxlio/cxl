import { cold, expectLog } from './util';
import { defer, mergeMap, of, from } from '../index';
import { spec } from '@cxl/spec';

function arrayRepeat(value: any, times: number) {
	const results = [];
	for (let i = 0; i < times; i++) {
		results.push(value);
	}
	return from(results);
}

export default spec('mergeMap', it => {
	it.should('map-and-flatten each item to an Observable', async a => {
		const values = { x: 10, y: 30, z: 50 };
		const e1 = cold('--1-----3--5-------|', values);
		const e1subs = '^                  !';
		const e2 = cold('x-x-x|              ', { x: 10 });
		const expected = '--10-10-10-30-30503050-50---|';
		const result = e1.pipe(mergeMap(x => e2.map(i => +i * +x)));

		await expectLog(a, result, expected);
		a.equal(e1.subscriptions, e1subs);
	});

	it.should('map and flatten an Array', a => {
		const source = of(1, 2, 3, 4).mergeMap(x => from([x + '!']));

		const expected = ['1!', '2!', '3!', '4!'];
		let completed = false;

		source.subscribe({
			next: x => {
				a.equal(x, expected.shift());
			},
			complete: () => {
				a.equal(expected.length, 0);
				completed = true;
			},
		});

		a.ok(completed);
	});

	it.should('support nested merges', a => {
		const results: (number | string)[] = [];

		of(1)
			.mergeMap(() => defer(() => of(2)))
			.mergeMap(() => defer(() => of(3)))

			.subscribe({
				next(value: any) {
					results.push(value);
				},
				complete() {
					results.push('done');
				},
			});

		a.equalValues(results, [3, 'done']);
	});

	it.should(
		'mergeMap many outer to many inner, and inner throws',
		async a => {
			const e1 = cold('-a-------b-------c-------d-------|');
			const e1subs = '^                        !';
			const i1 = cold('----i---j---k---l-------#');
			const expected = '-----i---j---(ki)---(lj)---(ki)---#';
			const result = e1.mergeMap(() => i1);

			await expectLog(a, result, expected);
			a.equal(e1.subscriptions, e1subs);
		}
	);

	it.should(
		'mergeMap many outer to many inner, inner never completes',
		async a => {
			const e1 = cold('-a-------b-------c-------d-------|');
			const e1subs = '^                                !';
			const i1 = cold('----i---j---k---l-------------------------');
			const expected =
				'-----i---j---(ki)---(lj)---(ki)---(lj)---(ki)---(lj)---k---l-------------------------';

			const result = e1.mergeMap(() => i1);

			await expectLog(a, result, expected);
			a.equal(e1.subscriptions, e1subs);
		}
	);

	it.should('mergeMap many outer to an array for each value', a => {
		const e1 = cold('2-----4--------3--------2-------|');
		const e1subs = '^                               !';
		const expected = '(22)-----(4444)--------(333)--------(22)-------|';

		const source = e1.mergeMap(value => arrayRepeat(value, +value));

		expectLog(a, source, expected);
		a.equal(e1.subscriptions, e1subs);
	});
});
