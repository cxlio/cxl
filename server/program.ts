import { readFile } from 'fs/promises';
import type { Observable } from '@cxl/rx';
import { colors } from './colors.js';

type OperationFunction<T> = (() => Promise<T>) | Promise<T> | Observable<T>;
// type Operation = Observable<OperationResult>;
type LogMessage<T = any> = string | ((p: T) => string) | Error;

interface Parameter {
	name: string;
	shortcut?: string;
	rest?: boolean;
	/// @default 'boolean'
	type?: 'string' | 'boolean' | 'number';
	help?: string;
	handle?(value: string): void;
}

/*interface OperationResult {
	start: bigint;
	time: bigint;
	tasks: number;
	result: any;
}*/

interface ProgramConfiguration {
	name?: string;
	parameters?: Parameter[];
	logColor?: keyof typeof colors;
}

interface Package {
	name: string;
}

interface Logger {
	(msg: LogMessage, op?: OperationFunction<any>): Promise<void>;
}

interface Program {
	name: string;
	pkg: Package;
	log: Logger;
}

/**
 * Read and parse a JSON file, ignores errors.
 * @param fileName Path of file to parse
 */
export async function readJson<T = any>(
	fileName: string
): Promise<T | undefined> {
	try {
		return JSON.parse(await readFile(fileName, 'utf8'));
	} catch (e) {
		return undefined;
	}
}

function logError(prefix: string, error: Error) {
	console.log(prefix + ' ' + colors.red(error.message));
	console.error(error);
}

/* function formatTime(time: bigint) {
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

function hrtime(): bigint {
	return process.hrtime.bigint();
}

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
}*/

function log(prefix: string, msg: LogMessage) {
	//, op?: OperationFunction<any>) {
	if (msg instanceof Error) logError(prefix, msg);
	// else if (op) return logOperation(prefix, msg, operation(op));

	console.log(`${prefix} ${msg}`);
	return Promise.resolve();
}

export function program(
	name: string | ProgramConfiguration,
	startFn: (p: Program) => void
) {
	const config = typeof name === 'string' ? { name } : name;

	return async () => {
		const pkg = (await readJson<Package>('package.json')) || { name: '' };
		const name = config.name || pkg.name;
		const color = config.logColor || 'green';
		const logPrefix = colors[color](name);

		return startFn({
			pkg,
			name,
			log: log.bind(log, logPrefix),
		});
	};
}
