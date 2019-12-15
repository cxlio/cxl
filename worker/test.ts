import { compile } from './index';
import { combineLatest, Subscription } from '../rx';
import { suite } from '../tester';

export default suite('worker', test => {
	test('Multiple Requests', a => {
		const done = a.async();
		function workerFn(payload: any, subscriber: Subscription<any>) {
			setTimeout(() => {
				subscriber.next(payload);
				subscriber.complete();
			}, Math.random() * 100);
		}

		const worker = compile(workerFn);
		const n = 500;
		const requests = [];
		for (let i = 0; i < n; i++) requests.push(worker.request(i));

		combineLatest(...requests).subscribe(res => {
			a.equal(res.length, n);
			res.forEach((val, i) => a.equal(val, i));
			a.ok(!worker.connected);
			done();
		});
	});

	test('Error', a => {
		const done = a.async();
		function workerFn(payload: any, subscriber: Subscription<any>) {
			subscriber.next(payload);
			setTimeout(() => {
				subscriber.error(++payload);
				setTimeout(() => {
					subscriber.next(++payload);
					subscriber.complete();
				});
			});
		}

		const worker = compile(workerFn);
		let count = 0;

		worker.request(0).subscribe({
			next(val) {
				a.equal(val, count++);
			},
			error(val) {
				a.equal(val, count++);
				a.ran(2);
				done();
			}
		});
	});

	test('Streaming', a => {
		const done = a.async();
		function workerFn(payload: any, subscriber: Subscription<any>) {
			subscriber.next(payload);
			setTimeout(() => {
				subscriber.next(++payload);
				setTimeout(() => {
					subscriber.next(++payload);
					subscriber.complete();
				});
			});
		}

		const worker = compile(workerFn);
		let count = 0;

		worker.request(0).subscribe({
			next(val) {
				a.equal(val, count++);
			},
			complete() {
				a.ran(3);
				done();
			}
		});
	});
});
