import { suite } from '../tester/index.js';
import exhaustMapSuite from './test/exhaustMap';
import mergeSuite from './test/merge';
import concatSuite from './test/concat';
import {
	BehaviorSubject,
	Observable,
	Subject,
	toPromise,
	filter,
	of,
	map,
	tap
} from './index.js';

declare function setInterval(fn: () => void, interval?: number): number;
declare function clearInterval(intervalId: number): void;

function empty() {
	return new Observable<void>(subs => subs.complete());
}

function throwError(msg: string) {
	return new Observable<void>(subs => subs.error(msg));
}

export default suite('rx', [
	exhaustMapSuite,
	mergeSuite,
	concatSuite,
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
				complete: done
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
					}
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
					}
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
					}
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
				}
			});
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
				.subscribe(function() {
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
					function() {
						if (times === 2) {
							subscription.unsubscribe();
						}
					},
					function() {
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
					function() {
						if (times === 2) {
							subscription.unsubscribe();
						}
					},
					undefined,
					function() {
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
					}
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
					}
				});
		});
	}),

	suite('Observable#unsubscribe()', test => {
		test('Observable#subscribe - unsubscribe', function(a) {
			const obs = new Observable(function(o) {
				o.next(0);
				o.next(0);
				o.complete();
				o.next(0);
				o.next(0);
			});
			let complete,
				times = 0;
			obs.subscribe({
				next: function() {
					times++;
				},
				complete: function() {
					complete = true;
				}
			});

			a.equal(times, 2);
			a.ok(complete);
		});
	}),

	/* suite('operators.map', it => {
		it('should throw an error if not passed a function', a => {
			try {
				of(1, 2, 3).pipe(map(<any>'potato'));
			} catch (e) {
				a.ok(e);
			}
		});
	}),*/

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
		test('Subject#constructor', function(a) {
			const subject = new Subject();
			let c = 1;
			subject.subscribe(function(b) {
				a.equal(b, c);
			});
			subject.subscribe(function(b) {
				a.equal(b, c);
			});

			subject.next(c);
			c++;
			subject.next(c);
		});

		test('error', function(a) {
			const subject = new Subject();
			let c = 1;
			subject.subscribe(b => a.equal(b, c));
			subject.subscribe(undefined, b => a.equal(b, c));

			subject.next(c);
			c++;
			subject.error(c);
		});

		test('complete', function(a) {
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
		test('BehaviorSubject#constructor', function(a) {
			let c = 1;
			const A = new BehaviorSubject(c);
			A.subscribe(val => a.equal(val, c));
			c++;
			A.next(c);
			a.equal(A.value, c);
		});
	}),

	suite('filter', test => {
		test('filter', a => {
			const A = new Observable(s => {
				[1, 2, 3, 4, 5, 6].forEach(s.next, s);
			});
			let filterFn = (v: number) => v < 4,
				B = A.pipe(filter(filterFn)),
				b = B.subscribe(v => {
					a.ok(v);
				}),
				i = 1;
			b.unsubscribe();

			filterFn = v => v % 2 === 0;
			B = A.pipe(filter(filterFn));
			b = B.subscribe(v => {
				a.ok(v);
			});
			b.unsubscribe();

			filterFn = () => true;
			B = A.pipe(filter(filterFn));
			b = B.subscribe(v => {
				a.equal(v, i++);
			});
			b.unsubscribe();
		});
	})
]);
