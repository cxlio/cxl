import { Observable, Subject, operator, toPromise } from '../index.js';
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
			if (events.length) {
				flush();
				log.events += '-'.repeat(diff - 1);
			} else log.events += '-'.repeat(diff);
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
		},
	}));
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
			const iter = stream[Symbol.iterator]();
			const inner = scheduler.subscribe(() => {
				const { done, value } = iter.next();

				if (done) inner.unsubscribe();
				else if (value === '|') subs.complete();
				else if (value === '#') subs.error(error);
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

export function cold(stream: string, values?: any, error?: any) {
	return new ColdObservable(stream, values, error);
}
