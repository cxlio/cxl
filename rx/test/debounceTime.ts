import { debounceTime, of, tap, toPromise } from '../index';
import { suite } from '../../spec/index.js';

export default suite('debounceTime', test => {
	test('should combine events from two observables', async a => {
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
});
