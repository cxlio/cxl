import { readFile } from 'fs/promises';
import type { Observable } from '@cxl/rx';
import { join } from 'path';

const codes = {
	reset: [0, 0],

	bold: [1, 22],
	dim: [2, 22],
	italic: [3, 23],
	underline: [4, 24],
	inverse: [7, 27],
	hidden: [8, 28],
	strikethrough: [9, 29],

	black: [30, 39],
	red: [31, 39],
	green: [32, 39],
	yellow: [33, 39],
	blue: [34, 39],
	magenta: [35, 39],
	cyan: [36, 39],
	white: [37, 39],
	gray: [90, 39],
	grey: [90, 39],

	brightRed: [91, 39],
	brightGreen: [92, 39],
	brightYellow: [93, 39],
	brightBlue: [94, 39],
	brightMagenta: [95, 39],
	brightCyan: [96, 39],
	brightWhite: [97, 39],

	bgBlack: [40, 49],
	bgRed: [41, 49],
	bgGreen: [42, 49],
	bgYellow: [43, 49],
	bgBlue: [44, 49],
	bgMagenta: [45, 49],
	bgCyan: [46, 49],
	bgWhite: [47, 49],
	bgGray: [100, 49],
	bgGrey: [100, 49],

	bgBrightRed: [101, 49],
	bgBrightGreen: [102, 49],
	bgBrightYellow: [103, 49],
	bgBrightBlue: [104, 49],
	bgBrightMagenta: [105, 49],
	bgBrightCyan: [106, 49],
	bgBrightWhite: [107, 49],

	// legacy styles for colors pre v1.0.0
	blackBG: [40, 49],
	redBG: [41, 49],
	greenBG: [42, 49],
	yellowBG: [43, 49],
	blueBG: [44, 49],
	magentaBG: [45, 49],
	cyanBG: [46, 49],
	whiteBG: [47, 49],
};

type Colors<T> = { [P in keyof T]: (str: string) => string };

const styles: any = {};
export const colors: Colors<typeof codes> = styles;

Object.keys(codes).forEach(key => {
	const val: any = (codes as any)[key];
	const open = '\u001b[' + val[0] + 'm';
	const close = '\u001b[' + val[1] + 'm';

	(styles as any)[key] = (str: string) => open + str + close;
});

type OperationFunction<T> = (() => Promise<T>) | Promise<T> | Observable<T>;
// type Operation = Observable<OperationResult>;
type LogMessage<T = any> = string | ((p: T) => string) | Error;

export interface Parameter {
	name: string;
	short?: string;
	/// @default 'boolean'
	type?: 'string' | 'boolean' | 'number';
	help?: string;
}

/*interface OperationResult {
	start: bigint;
	time: bigint;
	tasks: number;
	result: any;
}*/

export interface ProgramConfiguration {
	name?: string;
	logColor?: keyof typeof colors;
}

export interface Package {
	name: string;
}

export interface Logger {
	(msg: LogMessage, op?: OperationFunction<any>): Promise<void>;
}

export interface Program {
	name: string;
	pkg: Package;
	log: Logger;
}

const StringValue = `"(?:[^"\\\\]|\\\\.)*"`;
const MultipleShort = `-(\\w\\w+)`;
const ArgValue = `\\s*(?:=\\s*|\\s+)(${StringValue}|[^-][^\\s]*)`;
const SingleShortValue = `-(\\w)(?:${ArgValue})?`;
const Long = `--(\\w+)(?:${ArgValue})?`;

const ArgRegex = new RegExp(
	`\\s*(?:${MultipleShort}|${SingleShortValue}|${Long}|(${StringValue}|[^\\s]+))`,
	'g'
);

export const DefaultParameters: Parameter[] = [
	{
		name: 'help',
		short: 'h',
	},
	{
		name: 'config',
		help: 'Use JSON config file',
		short: 'c',
	},
];

interface Argument {
	name: string;
	value?: string;
}

function unquote(value: string) {
	return value.startsWith('"') && value.endsWith('"')
		? value.slice(1, value.length - 1)
		: value;
}

function findParam(
	parameters: Parameter[],
	shortcut: string,
	pvalue?: string,
	prop: 'short' | 'name' = 'short'
) {
	const result = parameters.find(p => p[prop] === shortcut);
	if (!result) throw new Error(`Invalid parameter -${shortcut}`);
	const value = pvalue && unquote(pvalue);

	return { name: result.name, value };
}

function findParameter(
	parameters: Parameter[],
	shortcut: string,
	prop: 'short' | 'name' = 'short'
) {
	const result = parameters.find(p => p[prop] === shortcut);
	if (!result) throw new Error(`Invalid parameter -${shortcut}`);
	return result;
}

function parseValue(param: Parameter, value: string) {
	if (param.type === 'number') return parseInt(value);
	if (param.type === 'string') return unquote(value);
	if (param.type === 'boolean') return value !== 'false';

	return value === '' || value === 'true' || value === undefined
		? true
		: value === 'false'
		? false
		: unquote(value);
}

function setParam(result: any, param: Parameter, value: string) {
	const key = param.name;
	const newValue = parseValue(param, value);
	const lastValue = result[key];

	if (lastValue === undefined) result[key] = newValue;
	else if (Array.isArray(lastValue)) result[key].push(newValue);
	else if (
		(newValue === true || newValue === false) &&
		(lastValue === true || lastValue === false)
	)
		result[key] = newValue;
	else result[key] = [result[key], newValue];
}

export function parseParameters(parameters: Parameter[], input: string) {
	const result: any = {};
	let m: RegExpExecArray | null;

	while ((m = ArgRegex.exec(input))) {
		const [
			,
			multipleShort,
			short,
			shortValue,
			long,
			longValue,
			restValue,
		] = m;
		if (multipleShort)
			multipleShort
				.split('')
				.forEach(p =>
					setParam(result, findParameter(parameters, p), '')
				);
		else if (short)
			setParam(result, findParameter(parameters, short), shortValue);
		else if (long)
			setParam(
				result,
				findParameter(parameters, long, 'name'),
				longValue
			);
		else if (restValue) setParam(result, { name: '$' }, restValue);
	}
	return result;
}

export function parseParametersArray(parameters: Parameter[], input: string) {
	const result: Argument[] = [];
	let m: RegExpExecArray | null;

	while ((m = ArgRegex.exec(input))) {
		const [
			,
			multipleShort,
			short,
			shortValue,
			long,
			longValue,
			restValue,
		] = m;
		if (multipleShort)
			result.push(
				...multipleShort.split('').map(p => findParam(parameters, p))
			);
		else if (short) result.push(findParam(parameters, short, shortValue));
		else if (long)
			result.push(findParam(parameters, long, longValue, 'name'));
		else if (restValue)
			result.push({ name: '*', value: unquote(restValue) });
	}

	return result;
}

export function parseArgv(parameters: Parameter[]) {
	return parseParameters(parameters, process.argv.slice(2).join(' '));
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

export function log(prefix: string, msg: LogMessage) {
	//, op?: OperationFunction<any>) {
	if (msg instanceof Error) logError(prefix, msg);
	// else if (op) return logOperation(prefix, msg, operation(op));

	console.log(`${prefix} ${msg}`);
	return Promise.resolve();
}

export function program(
	name: string | ProgramConfiguration,
	startFn: (p: Program) => void | Promise<void>
) {
	const config = typeof name === 'string' ? { name } : name;

	return async () => {
		const basePath = require.main?.path || '';
		const pkg = (await readJson<Package>(
			join(basePath, 'package.json')
		)) || { name: '' };
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
