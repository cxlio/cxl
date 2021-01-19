import {
	catchError,
	debounceTime,
	of,
	from,
	merge,
	tap,
	throwError,
	toPromise,
} from '../index';
import { spec } from '@cxl/spec';

export default spec('debounceTime', it => {
	it.should('debounce time asynchronously', async a => {
		let fired = 0;
		const promise = toPromise(
			from([1, 2, 3]).pipe(
				debounceTime(5),
				tap(() => fired++)
			)
		);
		a.equal(fired, 0);
		await promise;
		a.equal(fired, 1);
	});

	it.should('cancel timeout if error', async a => {
		let fired = 0;
		const promise = merge(of(1), throwError(0))
			.debounceTime(5)
			.tap(() => fired++)
			.catchError(e => ((fired = e), of(e)));
		a.equal(fired, 0);
		await promise;
		a.equal(fired, 0);
	});

	it.should('complete if empty', async a => {
		let fired = 0;
		await from([])
			.debounceTime(0)
			.tap(() => fired++);
		a.equal(fired, 0);
	});

	it.should('propagate errors', a => {
		let fired = false;
		throwError(true)
			.pipe(
				debounceTime(100),
				catchError(e => ((fired = e), of(e)))
			)
			.subscribe();
		a.equal(fired, true);
	});
});
