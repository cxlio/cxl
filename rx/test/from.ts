import { from } from '../index';
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
});
