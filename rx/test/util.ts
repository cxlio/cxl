import { Subject, Observable, operator, toPromise } from '../index.js';
import { Test } from '../../tester';

interface Log {
	events: string;
}

class Scheduler extends Subject<any> {
	time = 0;
	run() {
		let maxCycles = 100;
		while (this.subscriptions.size && maxCycles-- > 0) {
			this.next(this.time++);
		}
		this.time = 0;
	}
}

const scheduler = new Scheduler();

function logOperator() {
	const log: Log = { events: '' };
	let events: string[] = [];
	let time = scheduler.time;

	function flush() {
		if (events.length) {
			log.events +=
				events.length > 1 ? `(${events.join('')})` : events[0];
			events = [];
		}
	}

	function emit(ev: string) {
		const diff = scheduler.time - time;
		if (diff) {
			flush();
			log.events += '-'.repeat(diff - 1);
			time = scheduler.time;
		}
		events.push(ev);
	}

	return operator<string, Log>(subs => ({
		next(val) {
			emit(val);
		},
		error() {
			emit('#');
			flush();
			subs.next(log);
			subs.complete();
		},
		complete() {
			emit('|');
			flush();
			subs.next(log);
			subs.complete();
		}
	}));
}

export function logEvents(observable: Observable<any>) {
	const result = toPromise<Log>(observable.pipe(logOperator()));
	scheduler.run();
	return result;
}

export function expectLog(a: Test, obs: Observable<any>, events: string) {
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
		this.subscriptions += (diff > 1 ? ' '.repeat(diff - 1) : '') + ev;
		this.time = scheduler.time;
	}

	constructor(stream: string, values?: any) {
		super(subs => {
			this.log('^');

			const iter = stream[Symbol.iterator]();
			const inner = scheduler.subscribe(() => {
				const { done, value } = iter.next();

				if (done) inner.unsubscribe();
				else if (value === '|') subs.complete();
				else if (value === '#') subs.error(value);
				else if (value !== '-')
					subs.next((values && values[value]) || value);
			});
			return () => {
				this.log('!');
				inner.unsubscribe();
			};
		});
	}
}

export function cold(stream: string, values?: any) {
	return new ColdObservable(stream, values);
}
