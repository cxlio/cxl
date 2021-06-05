import { cold, expectLog } from './util';
import {
	EMPTY,
	catchError,
	concat,
	defer,
	observable,
	of,
	map,
	takeWhile,
	throwError,
} from '../index';
import { spec } from '@cxl/spec';

export default spec('catchError', it => {
	it.should('catch error and replace with a cold Observable', a => {
		const e1 = cold('--a--b--#       ');
		const e2 = cold('-1-2-3-|');
		const expected = '--a--b---1-2-3-|';

		const result = e1.pipe(catchError((_err: any) => e2));

		expectLog(a, result, expected);
	});

	it.should('catch error and replace it', a => {
		const e1 = cold('--a--b--c--------|');
		const subs = '^       !';
		const expected = '--a--b--(XYZ|)';

		const result = e1
			.map((n: string) => {
				if (n === 'c') {
					throw 'bad';
				}
				return n;
			})
			.catchError((_err: any) => {
				return of('X', 'Y', 'Z');
			});
		expectLog(a, result, expected);
		a.equal(e1.subscriptions, subs);
	});

	it.should(
		'stop listening to a synchronous observable when unsubscribed',
		a => {
			const sideEffects: number[] = [];
			const synchronousObservable = concat(
				defer(() => {
					sideEffects.push(1);
					return of(1);
				}),
				defer(() => {
					sideEffects.push(2);
					return of(2);
				}),
				defer(() => {
					sideEffects.push(3);
					return of(3);
				})
			);

			throwError(new Error('Some error'))
				.pipe(
					catchError(() => synchronousObservable),
					takeWhile(x => x != 2) // unsubscribe at the second side-effect
				)
				.subscribe(() => {
					/* noop */
				});

			a.equalValues(sideEffects, [1, 2]);
		}
	);

	it.should(
		'catch and allow the cold observable to be repeated with the third ' +
			'(caught) argument',
		a => {
			const e1 = cold('--a--b--c--------|       ');
			/*const subs = [
        '               ^-------!                ',
        '              --------^-------!         ',
        '              ----------------^-------! '
      ];*/
			const expected = '--a--b----a--b----a--b--#';

			let retries = 0;
			const result = e1.pipe(
				map((n: any) => {
					if (n === 'c') {
						throw 'bad';
					}
					return n;
				}),
				catchError((_: any, caught: any) => {
					if (retries++ === 2) {
						throw 'done';
					}
					return caught;
				})
			);

			expectLog(a, result, expected);
			//	a.equal(e1.subscriptions, subs);
		}
	);

	it.should('catch and replace a Observable.throw() as the source', a => {
		const e1 = cold('#');
		const subs = '(^!)';
		const expected = '(abc|)';

		const result = e1.pipe(catchError((_: any) => of('a', 'b', 'c')));

		expectLog(a, result, expected);
		a.equal(e1.subscriptions, subs);
	});

	it.should('mirror the source if it does not raise errors', a => {
		const e1 = cold('--a--b--c--|');
		const subs = '^          !';
		const expected = '--a--b--c--|';

		const result = e1.pipe(catchError((_: any) => of('x', 'y', 'z')));

		expectLog(a, result, expected);
		a.equal(e1.subscriptions, subs);
	});

	it.should(
		'properly handle async handled result if source is synchronous',
		a => {
			const done = a.async();
			const source = observable<string>(observer => {
				observer.error(new Error('kaboom!'));
				observer.complete();
			});

			const sourceWithDelay = observable<string>(observer => {
				observer.next('delayed');
				observer.complete();
			}).debounceTime(0);

			const values: string[] = [];
			source.pipe(catchError(_ => sourceWithDelay)).subscribe(
				value => values.push(value),
				e => {
					throw e;
				},
				() => {
					a.equalValues(values, ['delayed']);
					done();
				}
			);
		}
	);

	it.should(
		'should stop listening to a synchronous observable when unsubscribed',
		a => {
			const sideEffects: number[] = [];
			const synchronousObservable = observable(subscriber => {
				// This will check to see if the subscriber was closed on each loop
				// when the unsubscribe hits (from the `take`), it should be closed
				for (let i = 0; !subscriber.isUnsubscribed && i < 10; i++) {
					sideEffects.push(i);
					subscriber.next(i);
				}
			});

			synchronousObservable
				.catchError(() => EMPTY)
				.take(3)
				.subscribe(() => {
					/* noop */
				});

			a.equalValues(sideEffects, [0, 1, 2]);
		}
	);
});
