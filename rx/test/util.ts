import { Observable, Subject, toPromise } from '../index.js';
import { TestApi } from '@cxl/spec';

interface Log {
	events: string;
}

class Scheduler extends Subject<number> {
	time = 0;
	run() {
		let maxCycles = 100;
		while (this.observers.size && maxCycles-- > 0) {
			this.next(this.time);
			this.time++;
		}
		eof$.next(this.time - 1);
		this.time = 0;
	}
}

const scheduler = new Scheduler();
const eof$ = new Subject<number>();

function logOperator() {
	const log: Log = { events: '' };
	let events: string[] = [];
	let time = scheduler.time;

	function flush(schedulerTime = scheduler.time) {
		let diff = schedulerTime - time;
		if (events.length) {
			log.events +=
				events.length > 1 ? `(${events.join('')})` : events[0];
			events = [];
			diff--;
		}
		if (diff > 0) log.events += '-'.repeat(diff);
	}

	function emit(ev: string) {
		const diff = scheduler.time - time;
		if (diff) {
			flush();
			time = scheduler.time;
		}

		events.push(ev);
	}

	return (source: Observable<string>) =>
		new Observable<Log>(subscriber => {
			const eofSub = eof$.subscribe(t => {
				flush(t);
				subscriber.next(log);
				subscriber.complete();
			});
			const subscription = source.subscribe({
				next(val) {
					emit(val);
				},
				error() {
					emit('#');
					flush();
					subscriber.next(log);
					subscriber.complete();
				},
				complete() {
					emit('|');
					flush();
					subscriber.next(log);
					subscriber.complete();
				},
			});
			return () => {
				eofSub.unsubscribe();
				subscription.unsubscribe();
			};
		});
}

export function logEvents(observable: Observable<any>) {
	const result = toPromise<Log>(observable.pipe(logOperator()));
	scheduler.run();
	return result;
}

export function expectLog(a: TestApi, obs: Observable<any>, events: string) {
	return logEvents(obs).then(result => {
		a.equal(result.events, events);
		return result;
	});
}

class ColdObservable extends Observable<string> {
	subscriptions = '';
	time = scheduler.time;

	log(ev: string) {
		const diff = scheduler.time - this.time;
		if (diff === 0 && this.subscriptions.length)
			this.subscriptions = this.subscriptions.replace(
				/(.)$/,
				`($1${ev})`
			);
		else
			this.subscriptions +=
				(diff > 0
					? ' '.repeat(diff - (this.subscriptions ? 1 : 0))
					: '') + ev;
		this.time = scheduler.time;
	}

	constructor(stream: string, values?: any, error?: any) {
		super(subs => {
			this.log('^');
			let emitUnsub = true;
			const iter = stream[Symbol.iterator]();

			function handleEvent(value: string) {
				if (value === '|') subs.complete();
				else if (value === '#') subs.error(error);
				else if (value !== '-')
					subs.next((values && values[value]) || value);
			}

			function handleGroup() {
				const n = iter.next();
				if (n.value !== ')') {
					handleEvent(n.value);
					handleGroup();
				}
			}

			function next() {
				const { done, value } = iter.next();

				if (done) {
					emitUnsub = false;
					inner.unsubscribe();
				} else if (value === '(') handleGroup();
				else handleEvent(value);
			}

			const inner = scheduler.subscribe(next);

			return () => {
				if (emitUnsub) this.log('!');
				inner.unsubscribe();
			};
		});
	}
}

export function cold(stream: string, values?: any, error?: any) {
	return new ColdObservable(stream, values, error);
}

export function replaceValues(src: string, values: Record<string, any>) {
	return src.replace(/./g, c => values[c] || c);
}
