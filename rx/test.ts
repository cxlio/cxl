import {
	Observable,
	Reference,
	ReplaySubject,
	Subject,
	Subscriber,
	be,
	filter,
	first,
	map,
	observable,
	of,
	operators,
	pipe,
	ref,
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
import shareSuite from './test/share.js';

import { TestApi, suite, spec } from '@cxl/spec';

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
	shareSuite,
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
					next(x: number) {
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
					error(err: unknown) {
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

		test('should send errors thrown in the constructor down the error path', (a: TestApi) => {
			new Observable<number>(() => {
				throw new Error('this should be handled');
			}).subscribe({
				error(err) {
					a.ok(err);
					a.assert(err instanceof Error);
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

			source.subscribe({
				next(x) {
					nexted = x;
					mutatedByNext = true;
				},
				complete() {
					completed = true;
					mutatedByComplete = true;
				},
			});

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

		test('should return a Subscription that calls the unsubscribe function returned by the subscriber', a => {
			let unsubscribeCalled = false;

			const source = new Observable<number>(() => {
				return () => {
					unsubscribeCalled = true;
				};
			});

			const sub = source.subscribe(() => {
				//noop
			});
			a.equal(unsubscribeCalled, false);
			a.equal(typeof sub.unsubscribe, 'function');
			sub.unsubscribe();
			a.ok(unsubscribeCalled);
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
				.subscribe({
					next() {
						if (times === 2) {
							subscription.unsubscribe();
						}
					},
					error() {
						errorCalled = true;
					},
				});
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
				.subscribe({
					next() {
						if (times === 2) {
							subscription.unsubscribe();
						}
					},
					complete() {
						completeCalled = true;
					},
				});
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

		test('should forward errors', (a: TestApi) => {
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
						a.assert(e instanceof Error);
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
				A = new Observable(s => {
					s.next('hello');
					s.complete();
				}),
				B = new Observable(s => s.error(true)),
				promise = toPromise(A);

			promise.then(val => a.equal(val, 'hello'));

			toPromise(B).catch(e => {
				a.equal(e, true);
				done();
			});
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
			subject.subscribe({
				next(b) {
					a.equal(b, c);
				},
				error() {
					/* noop */
				},
			});
			subject.subscribe({ error: b => a.equal(b, c) });

			subject.next(c);
			c++;
			subject.error(c);
		});

		test('complete', a => {
			const subject = new Subject(),
				done = a.async();
			let c = 1;
			subject.subscribe(b => a.equal(b, c));
			subject.subscribe(b => a.equal(b, c));
			subject.subscribe({ complete: done });

			subject.next(c);
			c++;
			subject.complete();
			subject.complete();
			// It should ignore following next
			subject.subscribe(b => a.equal(b, c));
			subject.next(c);
		});

		test('subscribe', it => {
			it.should('clean out unsubscribed subscribers', a => {
				class DebugSubject extends Subject<unknown> {
					observers = new Set<Subscriber<unknown>>();
				}

				const subject = new DebugSubject();
				const sub1 = subject.subscribe();
				const sub2 = subject.subscribe();

				a.equal(subject.observers.size, 2);
				sub1.unsubscribe();
				a.equal(subject.observers.size, 1);
				sub2.unsubscribe();
				a.equal(subject.observers.size, 0);
			});

			it.should(
				'unsubscribe when subscriber unsubscribes synchronously',
				a => {
					const subject = new Subject();
					const obs = subject
						.tap(val => a.ok(val !== 3))
						.take(2)
						.tap(val => a.ok(val !== 3));
					obs.subscribe();
					subject.next(1);
					subject.next(2);
					subject.next(3);
					subject.next(4);
					subject.next(5);
				}
			);

			it.should(
				'handle subscribers that arrive and leave at different times, ' +
					'subject does not complete',
				a => {
					const subject = new Subject<number>();
					const results1: (number | string)[] = [];
					const results2: (number | string)[] = [];
					const results3: (number | string)[] = [];

					subject.next(1);
					subject.next(2);
					subject.next(3);
					subject.next(4);

					const subscription1 = subject.subscribe({
						next(x) {
							results1.push(x);
						},
						error() {
							results1.push('E');
						},
						complete() {
							results1.push('C');
						},
					});

					subject.next(5);

					const subscription2 = subject.subscribe({
						next(x) {
							results2.push(x);
						},
						error() {
							results2.push('E');
						},
						complete() {
							results2.push('C');
						},
					});

					subject.next(6);
					subject.next(7);

					subscription1.unsubscribe();

					subject.next(8);

					subscription2.unsubscribe();

					subject.next(9);
					subject.next(10);

					const subscription3 = subject.subscribe({
						next(x) {
							results3.push(x);
						},
						error() {
							results3.push('E');
						},
						complete() {
							results3.push('C');
						},
					});

					subject.next(11);

					subscription3.unsubscribe();

					a.equalValues(results1, [5, 6, 7]);
					a.equalValues(results2, [6, 7, 8]);
					a.equalValues(results3, [11]);
				}
			);

			it.should(
				'handle subscribers that arrive and leave at different times, ' +
					'subject completes',
				a => {
					const subject = new Subject<number>();
					const results1: (number | string)[] = [];
					const results2: (number | string)[] = [];
					const results3: (number | string)[] = [];

					subject.next(1);
					subject.next(2);
					subject.next(3);
					subject.next(4);

					const subscription1 = subject.subscribe({
						next(x) {
							results1.push(x);
						},
						error() {
							results1.push('E');
						},
						complete() {
							results1.push('C');
						},
					});

					subject.next(5);

					const subscription2 = subject.subscribe({
						next: x => results2.push(x),
						error: () => results2.push('E'),
						complete: () => results2.push('C'),
					});

					subject.next(6);
					subject.next(7);

					subscription1.unsubscribe();

					subject.complete();

					subscription2.unsubscribe();

					const subscription3 = subject.subscribe({
						next: x => results3.push(x),
						error: () => results3.push('E'),
						complete: () => results3.push('C'),
					});

					subscription3.unsubscribe();

					a.equalValues(results1, [5, 6, 7]);
					a.equalValues(results2, [6, 7, 'C']);
					a.equalValues(results3, ['C']);
				}
			);
			it.should(
				'handle subscribers that arrive and leave at different times, ' +
					'subject completes before nexting any value',
				a => {
					const subject = new Subject<number>();
					const results1: (number | string)[] = [];
					const results2: (number | string)[] = [];
					const results3: (number | string)[] = [];

					const subscription1 = subject.subscribe({
						next(x) {
							results1.push(x);
						},
						error() {
							results1.push('E');
						},
						complete() {
							results1.push('C');
						},
					});

					const subscription2 = subject.subscribe({
						next(x) {
							results2.push(x);
						},
						error() {
							results2.push('E');
						},
						complete() {
							results2.push('C');
						},
					});

					subscription1.unsubscribe();

					subject.complete();

					subscription2.unsubscribe();

					const subscription3 = subject.subscribe({
						next(x) {
							results3.push(x);
						},
						error() {
							results3.push('E');
						},
						complete() {
							results3.push('C');
						},
					});

					subscription3.unsubscribe();

					a.equalValues(results1, []);
					a.equalValues(results2, ['C']);
					a.equalValues(results3, ['C']);
				}
			);
			it.should('not next after completed', a => {
				const subject = new Subject<string>();
				const results: string[] = [];
				subject.subscribe({
					next: x => results.push(x),
					error: () => {
						/*noop*/
					},
					complete: () => results.push('C'),
				});
				subject.next('a');
				subject.complete();
				subject.next('b');
				a.equalValues(results, ['a', 'C']);
			});

			it.should('not next after error', a => {
				const error = new Error('wut?');
				const subject = new Subject<string>();
				const results: (string | Error)[] = [];
				subject.subscribe({
					next: x => results.push(x),
					error: err => results.push(err as Error),
				});
				subject.next('a');
				subject.error(error);
				subject.next('b');
				a.equalValues(results, ['a', error]);
			});
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

			ref.subscribe(val => a.equal(val, true));
			ref.next(true);
			ref.subscribe(val => {
				a.ok(val);
				done();
			});
			ref.complete();
		});

		test('should throw if not initialized', a => {
			const r = ref<boolean>();
			a.throws(() => r.value);
			r.next(true);
			a.equal(r.value, true);
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

	spec('Subscriber', it => {
		it.should('unsubscribe from synchronous parent after complete', a => {
			const done = a.async();
			of(1, 2, 3, 4)
				.tap(val => {
					if (val === 4) throw new Error('should not fire 4');
				})
				.takeWhile(val => val !== 3)
				.subscribe(val => {
					if (val > 1) {
						a.equal(val, 2);
						done();
					}
				});
		});
		/*it.should('ignore next messages after unsubscription', a => {
			let times = 0;

			const sub = new Subscriber({
				next() {
					times += 1;
				},
			});

			sub.next(0);
			sub.next(0);
			sub.unsubscribe();
			sub.next(0);

			a.equal(times, 2);
		});

		it.should('ignore error messages after unsubscription', a => {
			let times = 0;
			let errorCalled = false;

			const sub = new Subscriber({
				next() {
					times += 1;
				},
				error() {
					errorCalled = true;
				},
			});

			sub.next(0);
			sub.next(0);
			sub.unsubscribe();
			sub.next(0);
			sub.error(0);

			a.equal(times, 2);
			a.ok(!errorCalled);
		});

		it.should('ignore complete messages after unsubscription', a => {
			let times = 0;
			let completeCalled = false;

			const sub = new Subscriber({
				next() {
					times += 1;
				},
				complete() {
					completeCalled = true;
				},
			});

			sub.next(0);
			sub.next(0);
			sub.unsubscribe();
			sub.next(0);
			sub.complete();

			a.equal(times, 2);
			a.ok(!completeCalled);
		});*/

		it.should(
			'not be closed when other subscriber with same observer instance completes',
			a => {
				const observer = {
					next() {
						/*noop*/
					},
				};

				const sub1 = new Subscriber(observer);
				const sub2 = new Subscriber(observer);

				sub2.complete();

				a.ok(!sub1.closed);
				a.ok(sub2.closed);
			}
		);

		it.should('call complete observer without any arguments', a => {
			let argument: unknown[] | undefined;

			const observer = {
				complete: (...args: unknown[]) => {
					argument = args;
				},
			};

			const sub1 = new Subscriber(observer);
			sub1.complete();

			a.equal(argument?.length, 0);
		});

		it.should('NOT break this context on next methods', a => {
			// This is a contrived class to illustrate that we can pass another
			// object that is "observer shaped" and not have it lose its context
			// as it would have in v5 - v6.
			class CustomConsumer {
				valuesProcessed: string[] = [];

				// In here, we access instance state and alter it.
				next(value: string) {
					if (value === 'reset') {
						this.valuesProcessed = [];
					} else {
						this.valuesProcessed.push(value);
					}
				}
			}

			const consumer = new CustomConsumer();

			of('old', 'old', 'reset', 'new', 'new').subscribe(consumer);

			a.equalValues(consumer.valuesProcessed, ['new', 'new']);
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
			subject.subscribe({
				next(x: number) {
					a.equal(x, expects[i++]);
					if (i === 3) {
						subject.complete();
					}
				},
				error() {
					throw new Error('should not be called');
				},
				complete() {
					done();
				},
			});
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
			subject.subscribe({
				next: (x: number) => {
					a.equal(x, expects[i++]);
				},
				complete: done,
			});
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
			subject.subscribe({
				next: (x: number) => {
					a.equal(x, expects[i++]);
				},
				error: err => {
					a.equal(err, 'fooey');
					done();
				},
			});
		});

		a.should('only replay values within its buffer size', a => {
			const done = a.async();
			const subject = new ReplaySubject<number>(2);
			const expects = [2, 3];
			let i = 0;
			subject.next(1);
			subject.next(2);
			subject.next(3);
			subject.subscribe({
				next: (x: number) => {
					a.equal(x, expects[i++]);
					if (i === 2) {
						subject.complete();
					}
				},
				error: () => {
					throw new Error('should not be called');
				},
				complete() {
					done();
				},
			});
		});
	}),

	spec('operators', they => {
		they.should('be defined in the prototype of Observable', a => {
			for (const op in operators)
				a.ok(Observable.prototype[op as keyof typeof operators]);
		});

		they.should('unsubscribe from source on complete', a => {
			let wasCalled = 0;

			const source = observable(subs => {
				subs.complete();
				return () => wasCalled++;
			});
			const obs = source.switchMap(s => of(s));
			obs.subscribe();
			a.equal(wasCalled, 1);
		});
	}),
]);
