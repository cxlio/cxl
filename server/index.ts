import { colors } from './colors';
import { Observable, from, map } from '../rx';

declare const process: any;
declare const console: any;

function hrtime(): bigint {
	return process.hrtime.bigint();
}

interface OperationResult {
	start: bigint;
	time: bigint;
	tasks: number;
	result: any;
}

type OperationFunction = (() => Promise<any>) | Promise<any> | Observable<any>;
type Operation = Observable<OperationResult>;
type LogMessage<T = any> = string | ((p: T) => string) | Error;

function operation(fn: OperationFunction): Operation {
	let start = hrtime();
	let result = from(typeof fn === 'function' ? fn() : fn);
	let tasks = 0;

	return result.pipe(
		map(item => {
			let end = hrtime();
			const result = {
				start,
				tasks: ++tasks,
				time: end - start,
				result: item
			};
			start = end;
			return result;
		})
	);
}

function formatTime(time: bigint) {
	const s = Number(time) / 1e9,
		str = s.toFixed(4) + 's';
	// Color code based on time,
	return s > 0.1 ? (s > 0.5 ? colors.red(str) : colors.yellow(str)) : str;
}

/*export class Environment {
	private environment: any;

	constructor() {
		let env;

		try {
			env = require(process.cwd() + '/environment.json');
		} catch (e) {}

		this.environment = env || {};
	}
}*/

function logOperation(prefix: string, msg: LogMessage, op: Operation) {
	return op.subscribe(
		({ tasks, time, result }) => {
			const formattedTime =
				(tasks > 1 ? tasks + ' tasks' : '') + formatTime(time);
			const message = typeof msg === 'function' ? msg(result) : msg;
			console.log(`${prefix} ${message} (${formattedTime})`);
		},
		(error: any) => {
			console.log(`${prefix} Error`);
			console.error(error);
		}
	);
}

function logError(prefix: string, error: Error) {
	console.log(prefix + ' ' + colors.red(error.message));
	console.error(error);
}

export abstract class Application {
	abstract name: string;

	color: keyof typeof colors = 'green';
	version?: string;

	private coloredPrefix?: string;

	log(msg: LogMessage, op?: OperationFunction) {
		const pre = this.coloredPrefix || '';

		if (msg instanceof Error) return logError(pre, msg);

		if (op) return logOperation(pre, msg, operation(op));

		console.log(`${pre} ${msg}`);
	}

	async start() {
		this.coloredPrefix = colors[this.color](this.name);

		if (this.version) this.log(this.version);

		try {
			return await this.run();
		} catch (e) {
			this.log(e);
		}
	}

	abstract run(): Promise<any> | void;
}
