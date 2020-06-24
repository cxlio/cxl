import { Observable, from, map } from '../rx';
import { colors } from './colors.js';
import { promises as fs } from 'fs';
require('source-map-support').install();
import { resolve } from 'path';

function hrtime(): bigint {
	return process.hrtime.bigint();
}

interface OperationResult {
	start: bigint;
	time: bigint;
	tasks: number;
	result: any;
}

type OperationFunction<T> = (() => Promise<T>) | Promise<T> | Observable<T>;
type Operation = Observable<OperationResult>;
type LogMessage<T = any> = string | ((p: T) => string) | Error;

function operation<T>(fn: OperationFunction<T>): Operation {
	let start = hrtime();
	const result = from(typeof fn === 'function' ? fn() : fn);
	let tasks = 0;

	return result.pipe(
		map(item => {
			const end = hrtime();
			const result = {
				start,
				tasks: ++tasks,
				time: end - start,
				result: item,
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

function logOperation(prefix: string, msg: LogMessage, op: Operation) {
	let totalTime = BigInt(0);
	return new Promise<void>((resolve, reject) =>
		op.subscribe(
			({ tasks, time, result }) => {
				totalTime += time;
				const formattedTime =
					formatTime(time) +
					(tasks > 1 ? `, ${formatTime(totalTime)} total` : '');
				const message = typeof msg === 'function' ? msg(result) : msg;
				console.log(`${prefix} ${message} (${formattedTime})`);
			},
			reject,
			resolve
		)
	);
}

function logError(prefix: string, error: Error) {
	console.log(prefix + ' ' + colors.red(error.message));
	console.error(error);
}

function mtime(file: string) {
	return fs.stat(file).then(
		stat => stat.mtime.getTime(),
		() => NaN
	);
}

export async function syncFiles(file1: string, file2: string) {
	const time = Date.now();
	await Promise.all([
		fs.utimes(file1, time, time).catch(() => {}),
		fs.utimes(file2, time, time).catch(() => {}),
	]);
}

export async function filesNeedSync(file1: string, file2: string) {
	const [mtime1, mtime2] = await Promise.all([mtime(file1), mtime(file2)]);
	return mtime1 !== mtime2;
}

const ArgRegex = /^\s*(-{1,2})(\w[\w-]*)/;

export function mkdirp(dir: string): Promise<any> {
	return fs
		.stat(dir)
		.catch(() => mkdirp(resolve(dir, '..')).then(() => fs.mkdir(dir)));
}

interface Parameter {
	name: string;
	shortcut?: string;
	rest?: boolean;
	/// @default 'boolean'
	type?: 'string' | 'boolean' | 'number';
	help?: string;
	handle?(app: Application, value: string): void;
}

class ApplicationParameters {
	readonly parameters: Parameter[] = [
		{
			name: 'help',
			shortcut: 'h',
			handle(app: Application) {
				if (app.version) app.log(app.version);
				process.exit(0);
			},
		},
	];

	constructor(private app: Application) {}

	register(...p: Parameter[]) {
		this.parameters.push(...p);
	}

	parse(args: string[]) {
		const app = this.app;
		const parameters = this.parameters;
		const rest = parameters.find(a => a.rest);

		for (let i = 2; i < args.length; i++) {
			const arg = args[i];
			const match = ArgRegex.exec(arg);
			if (match) {
				const param = parameters.find(
					a => a.name === match[2] || a.shortcut === match[2]
				);
				if (!param) throw new Error(`Unknown argument ${arg}`);

				if (param.handle) param.handle(app, args[++i]);
				else if (!param.type || param.type === 'boolean')
					(app as any)[param.name] = true;
				else (app as any)[param.name] = args[++i];
			} else if (rest) {
				(app as any)[rest.name] = arg;
			}
		}
	}
}

/**
 * Read and parse a JSON file, ignores errors.
 * @param fileName Path of file to parse
 */
export async function readJson<T = any>(
	fileName: string
): Promise<T | undefined> {
	try {
		return JSON.parse(await fs.readFile(fileName, 'utf8'));
	} catch (e) {
		return undefined;
	}
}

export abstract class Application {
	abstract name: string;

	color: keyof typeof colors = 'green';
	version?: string;
	parameters = new ApplicationParameters(this);
	package?: any;

	private coloredPrefix?: string;

	protected setup() {}

	log(msg: LogMessage, op?: OperationFunction<any>) {
		const pre = this.coloredPrefix || '';

		if (msg instanceof Error) logError(pre, msg);
		else if (op) return logOperation(pre, msg, operation(op));

		console.log(`${pre} ${msg}`);
		return Promise.resolve();
	}

	handleError(e?: any) {
		this.log(e);
		process.exit(1);
	}

	async start() {
		try {
			this.package = JSON.parse(
				await fs.readFile(__dirname + '/package.json', 'utf8')
			);
			if (!this.version) this.version = this.package.version;
		} catch (e) {}

		this.coloredPrefix = colors[this.color](this.name);
		this.setup();
		this.parameters.parse(process.argv);

		if (this.version) this.log(this.version);

		try {
			return await this.run();
		} catch (e) {
			this.handleError(e);
		}
	}

	abstract run(): Promise<any> | void;
}
