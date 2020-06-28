import {
	catchError,
	debounceTime,
	of,
	tap,
	throwError,
	toPromise,
} from '../index';
import { suite } from '../../spec/index.js';

export default suite('debounceTime', test => {
	test('should debounce time asynchronously', async a => {
		let fired = false;
		const promise = toPromise(
			of(true).pipe(
				debounceTime(100),
				tap(() => (fired = true))
			)
		);
		a.equal(fired, false);
		await promise;
		a.equal(fired, true);
	});

	test('should propagate errors', a => {
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
