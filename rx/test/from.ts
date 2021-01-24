import { from, of, observableSymbol } from '../index';
import { suite } from '@cxl/spec';

export default suite('from', test => {
	test('should create an observable from an array', a => {
		let current = 10,
			count = 0;
		const done = a.async();

		from([10, 20, 30]).subscribe({
			next(val) {
				a.equal(val, current);
				current += 10;
				count++;
			},
			complete() {
				a.equal(count, 3);
				done();
			},
		});
	});
	test('should create an observable from a promise', a => {
		const done = a.async();
		let count = 0;

		from(new Promise(resolve => resolve(10))).subscribe({
			next(val) {
				a.equal(val, 10);
				count++;
			},
			complete() {
				a.equal(count, 1);
				done();
			},
		});
	});
	test('should create an observable from observable', a => {
		const done = a.async();
		const source = of(10);
		let count = 0;

		from(source).subscribe({
			next(val) {
				a.equal(val, 10);
				count++;
			},
			complete() {
				a.equal(count, 1);
				done();
			},
		});
	});
	test('should create an observable from subscribable', a => {
		const done = a.async();
		const source = {
			[observableSymbol]: () => ({
				subscribe(subs: any) {
					subs.next(10);
					subs.complete();
					return {
						unsubscribe() {
							/*noop*/
						},
					};
				},
			}),
		};
		let count = 0;

		from(source)
			.subscribe({
				next(val) {
					a.equal(val, 10);
					count++;
				},
				complete() {
					a.equal(count, 1);
					done();
				},
			})
			.unsubscribe();
	});
});
