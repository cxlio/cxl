import { colors } from './colors.js';
import { Observable, from, map } from '../rx';

function hrtime(): bigint {
	return process.hrtime.bigint();
}

interface OperationResult {
	start: bigint;
	time: bigint;
	tasks: number;
	result: any;
}

export type ApplicationArguments = { [key: string]: any };
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
	let totalTime = BigInt(0);
	return op.subscribe(
		({ tasks, time, result }) => {
			totalTime += time;
			const formattedTime =
				formatTime(time) +
				(tasks > 1 ? `, ${formatTime(totalTime)} total` : '');
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
	arguments?: ApplicationArguments;
	version?: string;

	private coloredPrefix?: string;

	log(msg: LogMessage, op?: OperationFunction) {
		const pre = this.coloredPrefix || '';

		if (msg instanceof Error) return logError(pre, msg);
		if (op) return logOperation(pre, msg, operation(op));

		console.log(`${pre} ${msg}`);
	}

	handleError(e?: any) {
		this.log(e);
		process.exit(1);
	}

	private parseArguments() {
		const args: string[] = process.argv.slice(2);
		return args.reduce(
			(result, arg: string) => {
				const match = /-{1,2}([\w\d-]+)/.exec(arg);
				if (match) result[match[1]] = true;
				else result.files.push(arg);
				return result;
			},
			{ files: [] } as ApplicationArguments
		);
	}

	async start() {
		this.arguments = this.parseArguments();
		this.coloredPrefix = colors[this.color](this.name);

		if (this.version) this.log(this.version);

		try {
			return await this.run();
		} catch (e) {
			this.handleError(e);
		}
	}

	abstract run(): Promise<any> | void;
}
