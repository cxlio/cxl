import { dirname, relative, resolve } from 'path';
import { existsSync, utimesSync, writeFileSync } from 'fs';
import { SpawnOptions, spawn, execSync } from 'child_process';

import { Logger, colors, sh, log, operation } from '@cxl/program';
import { Observable } from '@cxl/rx';
import { Output } from '@cxl/source';
import { tscVersion } from './tsc.js';
import { BASEDIR, readPackage } from './package.js';

export interface BuildConfiguration {
	target?: string;
	outputDir: string;
	tasks: Task[];
}
export type Task = Observable<Output>;

const AppName = colors.green('build');
export const appLog = log.bind(null, AppName);

function kb(bytes: number) {
	return (bytes / 1000).toFixed(2) + 'kb';
}

class Build {
	outputDir: string;

	constructor(private log: Logger, private config: BuildConfiguration) {
		this.outputDir = config.outputDir || '.';
	}

	private async runTask(task: Task) {
		await task.tap(result => {
			const outFile = resolve(this.outputDir, result.path);
			const source = result.source;
			const outputDir = dirname(outFile);
			if (!existsSync(outputDir)) execSync(`mkdir -p ${outputDir}`);
			writeFileSync(outFile, source);
			if (result.mtime) utimesSync(outFile, result.mtime, result.mtime);

			const printPath = relative(process.cwd(), outFile);
			this.log(`${printPath} ${kb((result.source || '').length)}`);
		});
	}

	async build() {
		try {
			const target = this.config.target || '';
			if (target) this.log(`target ${target}`);

			execSync(`mkdir -p ${this.outputDir}`);

			await Promise.all(
				this.config.tasks.map(task => this.runTask(task))
			);
		} catch (e) {
			console.log('BUILD: ', e);
			throw 'Build finished with errors';
		}
	}
}

export async function build(...targets: BuildConfiguration[]) {
	if (!targets) throw new Error('Invalid configuration');

	if (BASEDIR !== process.cwd()) {
		process.chdir(BASEDIR);
		appLog(`chdir "${BASEDIR}"`);
	}

	const pkg = readPackage();

	appLog(`${pkg.name} ${pkg.version}`);
	appLog(`typescript ${tscVersion}`);

	const runTargets = [undefined, ...process.argv];
	try {
		for (const targetId of runTargets) {
			for (const target of targets)
				if (target.target === targetId)
					await new Build(appLog, target).build();
		}
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

function formatTime(time: bigint) {
	const s = Number(time) / 1e9,
		str = s.toFixed(4) + 's';
	// Color code based on time,
	return s > 0.1 ? (s > 0.5 ? colors.red(str) : colors.yellow(str)) : str;
}

export function exec(cmd: string) {
	return new Observable<never>(subs => {
		appLog(`sh ${cmd}`);
		operation(sh(cmd, {})).then(
			result => {
				appLog(`sh ${cmd}`, formatTime(result.time));
				if (result.result) console.log(result.result);
				subs.complete();
			},
			e => {
				subs.error(e);
			}
		);
	});
}

export function shell(cmd: string, options: SpawnOptions = {}) {
	return new Observable<Buffer>(subs => {
		const proc = spawn(cmd, [], { shell: true, ...options });
		let output: Buffer;
		let error: Buffer;
		proc.stdout?.on(
			'data',
			data =>
				(output = output
					? Buffer.concat([output, Buffer.from(data)])
					: Buffer.from(data))
		);
		proc.stderr?.on(
			'data',
			data =>
				(error = error
					? Buffer.concat([error, Buffer.from(data)])
					: Buffer.from(data))
		);
		proc.on('close', code => {
			if (code) subs.error(error || output);
			else {
				subs.next(output);
				subs.complete();
			}
		});
	});
}

export function run(
	cmd: string,
	params: Record<string, string | number | boolean | string[] | undefined>,
	options?: SpawnOptions
) {
	const args = [cmd];
	for (const p in params) {
		const val = params[p];
		if (val === false || val === undefined) continue;
		if (Array.isArray(val)) {
			val.forEach(v => args.push(`--${p} "${v}"`));
		} else
			args.push(typeof val === 'boolean' ? `--${p}` : `--${p} "${val}"`);
	}
	console.log(args.join(' '));
	return sh(args.join(' '), options);
}
