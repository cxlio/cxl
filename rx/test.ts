import {
	Observable,
	Reference,
	ReplaySubject,
	Subject,
	be,
	filter,
	first,
	map,
	of,
	pipe,
	tap,
	toPromise,
} from './index.js';
import combineLatestSuite from './test/combineLatest.js';
import catchErrorSuite from './test/catchError.js';
import concatSuite from './test/concat.js';
import debounceTimeSuite from './test/debounceTime.js';
import deferSuite from './test/defer.js';
import distinctUntilChangedSuite from './test/distinctUntilChanged.js';
import exhaustMapSuite from './test/exhaustMap.js';
import filterSuite from './test/filter.js';
import fromSuite from './test/from.js';
import mergeSuite from './test/merge.js';
import switchMapSuite from './test/switchMap.js';
import reduceSuite from './test/reduce.js';
import mergeMapSuite from './test/mergeMap.js';
import takeSuite from './test/take.js';
import publishLast from './test/publishLast.js';
import finalizeSuite from './test/finalize.js';
import zipSuite from './test/zip.js';

import { suite, spec } from '@cxl/spec';

declare function setInterval(fn: () => void, interval?: number): number;
declare function clearInterval(intervalId: number): void;

function empty() {
	return new Observable<void>(subs => subs.complete());
}

function throwError(msg: string) {
	return new Observable<void>(subs => subs.error(msg));
}

export default suite('rx', [
	catchErrorSuite,
	deferSuite,
	distinctUntilChangedSuite,
	filterSuite,
	finalizeSuite,
	fromSuite,
	exhaustMapSuite,
	mergeSuite,
	mergeMapSuite,
	concatSuite,
	combineLatestSuite,
	debounceTimeSuite,
	reduceSuite,
	switchMapSuite,
	takeSuite,
	publishLast,
	zipSuite,
	suite('Observable', test => {
		test('constructor', a => {
			const observable = new Observable(function subscribe(observer) {
					observer.next(1);
					observer.next(2);
					observer.next(3);
					observer.complete();
				}),
				done = a.async();
			let i = 1;
			observable.subscribe({
				next(b) {
					a.equal(b, i++);
				},
				complete: done,
			});
		});

		test(
			'should accept an anonymous observer with just a next function and call the next function in the context' +
				' of the anonymous observer',
			a => {
				//intentionally not using lambda to avoid typescript's this context capture
				const o = {
					myValue: 'foo',
					next(x: any) {
						a.equal(this.myValue, 'foo');
						a.equal(x, 1);
					},
				};

				of(1).subscribe(o);
			}
		);
		test(
			'should accept an anonymous observer with just an error function and call the error function in the context' +
				' of the anonymous observer',
			a => {
				//intentionally not using lambda to avoid typescript's this context capture
				const o = {
					myValue: 'foo',
					error(err: any) {
						a.equal(this.myValue, 'foo');
						a.equal(err, 'bad');
					},
				};

				throwError('bad').subscribe(o);
			}
		);

		test(
			'should accept an anonymous observer with just a complete function and call the complete function in the' +
				' context of the anonymous observer',
			a => {
				//intentionally not using lambda to avoid typescript's this context capture
				const o = {
					myValue: 'foo',
					complete: function complete() {
						a.equal(this.myValue, 'foo');
					},
				};

				empty().subscribe(o);
			}
		);

		test('should send errors thrown in the constructor down the error path', a => {
			new Observable<number>(() => {
				throw new Error('this should be handled');
			}).subscribe({
				error(err) {
					a.ok(err);
					a.ok(err instanceof Error);
					a.equal(err.message, 'this should be handled');
				},
			});
		});

		test('should be thenable', async a => {
			const res = await of(10);
			a.equal(res, 10);
		});
	}),

	suite('Observable#subscribe', test => {
		test('should be synchronous', a => {
			let subscribed = false;
			let nexted: string;
			let completed: boolean;
			const source = new Observable<string>(observer => {
				subscribed = true;
				observer.next('wee');
				a.equal(nexted, 'wee');
				observer.complete();
				a.ok(completed);
			});

			a.ok(!subscribed);

			let mutatedByNext = false;
			let mutatedByComplete = false;

			source.subscribe(
				x => {
					nexted = x;
					mutatedByNext = true;
				},
				undefined,
				() => {
					completed = true;
					mutatedByComplete = true;
				}
			);

			a.ok(mutatedByNext);
			a.ok(mutatedByComplete);
		});

		test('should work when subscribe is called with no arguments', a => {
			const source = new Observable<string>(subscriber => {
				subscriber.next('foo');
				subscriber.complete();
				a.ok(subscriber);
			});

			source.subscribe();
		});

		test('should ignore next messages after unsubscription', a => {
			let times = 0;

			const subscription = new Observable<number>(observer => {
				let i = 0;
				const done = a.async();
				const id = setInterval(() => {
					observer.next(i++);
				});

				return () => {
					clearInterval(id);
					a.equal(times, 2);
					done();
				};
			})
				.pipe(tap(() => (times += 1)))
				.subscribe(function () {
					if (times === 2) {
						subscription.unsubscribe();
					}
				});
		});

		test('should ignore error messages after unsubscription', a => {
			let times = 0;
			let errorCalled = false;
			const done = a.async();

			const subscription = new Observable<number>(observer => {
				let i = 0;
				const id = setInterval(() => {
					observer.next(i++);
					if (i === 3) {
						observer.error(new Error());
					}
				});

				return () => {
					clearInterval(id);
					a.equal(times, 2);
					a.ok(!errorCalled);
					done();
				};
			})
				.pipe(tap(() => (times += 1)))
				.subscribe(
					function () {
						if (times === 2) {
							subscription.unsubscribe();
						}
					},
					function () {
						errorCalled = true;
					}
				);
		});

		test('should ignore complete messages after unsubscription', a => {
			let times = 0;
			let completeCalled = false;

			const done = a.async();
			const subscription = new Observable<number>(observer => {
				let i = 0;
				const id = setInterval(() => {
					observer.next(i++);
					if (i === 3) {
						observer.complete();
					}
				});

				return () => {
					clearInterval(id);
					a.equal(times, 2);
					a.ok(!completeCalled);
					done();
				};
			})
				.pipe(tap(() => (times += 1)))
				.subscribe(
					function () {
						if (times === 2) {
							subscription.unsubscribe();
						}
					},
					undefined,
					function () {
						completeCalled = true;
					}
				);
		});

		test('should not be unsubscribed when other empty subscription completes', a => {
			let unsubscribeCalled = false;
			const source = new Observable<number>(() => {
				return () => {
					unsubscribeCalled = true;
				};
			});

			source.subscribe();

			a.ok(!unsubscribeCalled);

			empty().subscribe();

			a.ok(!unsubscribeCalled);
		});

		test('should not be unsubscribed when other subscription with same observer completes', a => {
			let unsubscribeCalled = false;
			const source = new Observable<number>(() => {
				return () => {
					unsubscribeCalled = true;
				};
			});

			const observer = {};

			source.subscribe(observer);

			a.ok(!unsubscribeCalled);

			empty().subscribe(observer);

			a.ok(!unsubscribeCalled);
		});
	}),

	suite('Observable#pipe', test => {
		test('should pipe multiple operations', a => {
			let nextCalled = false;

			of('test')
				.pipe(
					map(x => x + x),
					map(x => x + '!!!')
				)
				.subscribe({
					next(x) {
						nextCalled = true;
						a.equal(x, 'testtest!!!');
					},
					complete() {
						a.ok(nextCalled);
					},
				});
		});

		test('should forward errors', a => {
			let errorCalled = false;

			of('test')
				.pipe(
					map(() => {
						throw new Error('hi');
					}),
					map(x => x + '!!!')
				)
				.subscribe({
					error(e) {
						errorCalled = true;
						a.ok(e);
						a.equal(e.message, 'hi');
					},
					complete() {
						a.ok(errorCalled);
					},
				});
		});
	}),

	suite('Observable#unsubscribe()', test => {
		test('Observable#subscribe - unsubscribe', function (a) {
			const obs = new Observable(function (o) {
				o.next(0);
				o.next(0);
				o.complete();
				o.next(0);
				o.next(0);
			});
			let complete,
				times = 0;
			obs.subscribe({
				next: function () {
					times++;
				},
				complete: function () {
					complete = true;
				},
			});

			a.equal(times, 2);
			a.ok(complete);
		});
	}),

	suite('Observable - Error Propagation', test => {
		test('Unhandled Error', a => {
			try {
				throwError('error').subscribe();
			} catch (e) {
				a.equal(e, 'error');
			}
		});
	}),

	suite('toPromise', test => {
		test('rx#toPromise', a => {
			const done = a.async(),
				A = new Observable(s => s.next('hello')),
				B = new Observable(s => s.error(true)),
				promise = toPromise(A);
			a.ok(promise);
			promise.then(val => a.equal(val, 'hello'));

			toPromise(B).catch(done);
		});
	}),

	suite('Subject', test => {
		test('Subject#constructor', function (a) {
			const subject = new Subject();
			let c = 1;
			subject.subscribe(function (b) {
				a.equal(b, c);
			});
			subject.subscribe(function (b) {
				a.equal(b, c);
			});

			subject.next(c);
			c++;
			subject.next(c);
		});

		test('error', function (a) {
			const subject = new Subject();
			let c = 1;
			subject.subscribe(
				b => a.equal(b, c),
				() => {
					/* noop */
				}
			);
			subject.subscribe(undefined, b => a.equal(b, c));

			subject.next(c);
			c++;
			subject.error(c);
		});

		test('complete', function (a) {
			const subject = new Subject(),
				done = a.async();
			let c = 1;
			subject.subscribe(b => a.equal(b, c));
			subject.subscribe(b => a.equal(b, c));
			subject.subscribe(undefined, undefined, done);

			subject.next(c);
			c++;
			subject.complete();
			subject.complete();
		});
	}),

	suite('BehaviorSubject', test => {
		test('BehaviorSubject#constructor', function (a) {
			let c = 1;
			const A = be(c);
			A.subscribe(val => a.equal(val, c));
			c++;
			A.next(c);
			a.equal(A.value, c);
		});
	}),

	suite('Reference', test => {
		test('Reference', a => {
			const ref = new Reference<boolean>();
			const done = a.async();

			ref.first().subscribe(val => {
				a.ok(val);
				done();
			});
			ref.next(true);
		});

		test('should throw if not initialized', a => {
			const ref = new Reference<boolean>();
			a.throws(() => ref.value);
			ref.next(true);
			a.equal(ref.value, true);
		});
	}),

	spec('pipe', a => {
		a.test('support for multiple operators', a => {
			const v1 = be(1);
			const p1 = pipe(
				first(),
				filter<number>(v => !!v),
				tap(a => v1.next(a))
			);
			of(2).pipe(p1).subscribe();
			a.equal(v1.value, 2);
		});
	}),

	spec('ReplaySubject', a => {
		a.should('add the observer before running subscription code', a => {
			const subject = new ReplaySubject<number>();
			subject.next(1);
			const results: number[] = [];

			subject.subscribe(value => {
				results.push(value);
				if (value < 3) {
					subject.next(value + 1);
				}
			});

			a.equal(results[0], 1);
			a.equal(results[1], 2);
			a.equal(results[2], 3);
		});

		a.should('replay values upon subscription', a => {
			const done = a.async();
			const subject = new ReplaySubject<number>();
			const expects = [1, 2, 3];
			let i = 0;
			subject.next(1);
			subject.next(2);
			subject.next(3);
			subject.subscribe(
				(x: number) => {
					a.equal(x, expects[i++]);
					if (i === 3) {
						subject.complete();
					}
				},
				() => {
					throw new Error('should not be called');
				},
				() => {
					done();
				}
			);
		});

		a.should('replay values and complete', a => {
			const done = a.async();
			const subject = new ReplaySubject<number>();
			const expects = [1, 2, 3];
			let i = 0;
			subject.next(1);
			subject.next(2);
			subject.next(3);
			subject.complete();
			subject.subscribe(
				(x: number) => {
					a.equal(x, expects[i++]);
				},
				undefined,
				done
			);
		});

		a.should('replay values and error', a => {
			const done = a.async();
			const subject = new ReplaySubject<number>();
			const expects = [1, 2, 3];
			let i = 0;
			subject.next(1);
			subject.next(2);
			subject.next(3);
			subject.error('fooey');
			subject.subscribe(
				(x: number) => {
					a.equal(x, expects[i++]);
				},
				(err: any) => {
					a.equal(err, 'fooey');
					done();
				}
			);
		});

		a.should('only replay values within its buffer size', a => {
			const done = a.async();
			const subject = new ReplaySubject<number>(2);
			const expects = [2, 3];
			let i = 0;
			subject.next(1);
			subject.next(2);
			subject.next(3);
			subject.subscribe(
				(x: number) => {
					a.equal(x, expects[i++]);
					if (i === 2) {
						subject.complete();
					}
				},
				() => {
					throw new Error('should not be called');
				},
				() => {
					done();
				}
			);
		});
	}),
]);
