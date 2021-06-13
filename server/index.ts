import { Observable, from, map } from '@cxl/rx';
import { basename, dirname, join, resolve } from 'path';
import { colors } from './colors.js';
import { SpawnOptions, spawn } from 'child_process';
import { readFileSync, promises as fs } from 'fs';

require('source-map-support').install();

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

process.on('unhandledRejection', up => {
	throw up;
});

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
		op.subscribe({
			next: ({ tasks, time, result }) => {
				totalTime += time;
				const formattedTime =
					formatTime(time) +
					(tasks > 1 ? `, ${formatTime(totalTime)} total` : '');
				const message = typeof msg === 'function' ? msg(result) : msg;
				console.log(`${prefix} ${message} (${formattedTime})`);
			},
			error: reject,
			complete: resolve,
		})
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
		fs.utimes(file1, time, time).catch(),
		fs.utimes(file2, time, time).catch(),
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

export function sh(cmd: string, options: SpawnOptions = {}) {
	return new Promise<string>((resolve, reject) => {
		const proc = spawn(cmd, [], { shell: true, ...options });
		let output = '';
		proc.stdout?.on('data', data => (output += data?.toString() || ''));
		proc.stderr?.on('data', data => (output += data?.toString() || ''));
		proc.on('close', code => (code ? reject(output) : resolve(output)));
	});
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
		{
			name: 'config',
			help: 'Use JSON config file',
			shortcut: 'c',
			handle(app: Application, fileName: string) {
				app.parameters.parseJsonFile(fileName);
			},
		},
	];

	constructor(private app: Application) {}

	register(...p: Parameter[]) {
		this.parameters.push(...p);
	}

	parseJsonFile(fileName: string) {
		try {
			const json = JSON.parse(readFileSync(fileName, 'utf8'));
			this.parseJson(json);
		} catch (e) {
			throw new Error(`Invalid configuration file "${fileName}"`);
		}
	}

	parseJson(json: any) {
		this.parameters.forEach(p => {
			const paramName = p.name;
			if (paramName in json) {
				const optionValue = json[paramName];
				(this.app as any)[paramName] = optionValue;
			}
		});
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
	name?: string;
	color: keyof typeof colors = 'green';
	version?: string;
	parameters = new ApplicationParameters(this);
	package?: any;
	started = false;

	private coloredPrefix?: string;

	setup() {
		// Implement
	}

	log(msg: LogMessage, op?: OperationFunction<any>) {
		const pre = this.coloredPrefix || '';

		if (msg instanceof Error) logError(pre, msg);
		else if (op) return logOperation(pre, msg, operation(op));

		console.log(`${pre} ${msg}`);
		return Promise.resolve();
	}

	protected handleError(e?: any) {
		this.log(e);
		process.exit(1);
	}

	async start() {
		if (this.started) throw new Error('Application already started');
		this.started = true;

		const dir = dirname(require.main?.filename || process.cwd());
		try {
			this.package = JSON.parse(
				await fs.readFile(join(dir, 'package.json'), 'utf8')
			);
		} catch (e) {
			this.package = {};
		}

		if (!this.name) this.name = this.package.name || basename(dir);
		if (!this.version) this.version = this.package.version;

		try {
			if (!this.name) throw new Error('Application name is required');

			this.coloredPrefix = colors[this.color](this.name);
			this.setup();
			this.parameters.parse(process.argv);

			if (this.version) this.log(this.version);

			return await this.run();
		} catch (e) {
			this.handleError(e);
		}
	}

	protected abstract run(): Promise<any> | void;
}
