import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync, utimesSync, writeFileSync } from 'fs';
import { SpawnOptions, spawn, execSync } from 'child_process';

import { Application, sh } from '@cxl/server';
import { Observable } from '@cxl/rx';
import { Output } from '@cxl/source';
import { tscVersion } from './tsc.js';
import { BASEDIR, Package, readPackage } from './package.js';

export interface BuildConfiguration {
	target?: string;
	outputDir: string;
	tasks: Task[];
}
export type Task = Observable<Output>;

function kb(bytes: number) {
	return (bytes / 1000).toFixed(2) + 'kb';
}

class Build {
	outputDir: string;

	constructor(private builder: Builder, private config: BuildConfiguration) {
		this.outputDir = config.outputDir || '.';
	}

	private writeOutput(result: Output) {
		const outFile = resolve(this.outputDir, result.path);
		const source = result.source;
		const outputDir = dirname(outFile);
		if (!existsSync(outputDir)) mkdirSync(outputDir);
		writeFileSync(outFile, source);
		if (result.mtime) utimesSync(outFile, result.mtime, result.mtime);
		return result;
	}

	private runTask(task: Task) {
		return this.builder.log(
			(output: Output) =>
				`${join(this.outputDir, output.path)} ${kb(
					(output.source || '').length
				)}`,
			task.tap(result => this.writeOutput(result))
		);
	}

	async build() {
		try {
			const pkg = this.builder.modulePackage;
			if (!pkg) throw new Error('Invalid package');

			const target = this.config.target || `${pkg.name} ${pkg.version}`;
			this.builder.log(`target ${target}`);

			execSync(`mkdir -p ${this.outputDir}`);

			await Promise.all(
				this.config.tasks.map(task => this.runTask(task))
			);
		} catch (e) {
			this.builder.log(e as any);
			throw 'Build finished with errors';
		}
	}
}

export class Builder extends Application {
	name = '@cxl/build';
	baseDir?: string;
	outputDir = '';
	modulePackage?: Package;
	hasErrors = false;

	protected async run() {
		this.modulePackage = readPackage();

		if (BASEDIR !== process.cwd()) {
			process.chdir(BASEDIR);
			this.log(`chdir "${BASEDIR}"`);
		}

		this.log(`typescript ${tscVersion}`);
	}

	async build(config: BuildConfiguration): Promise<void> {
		try {
			if (config.target && !process.argv.includes(config.target)) return;
			await new Build(this, config).build();
		} catch (e) {
			this.handleError(e);
		}
	}
}

export const builder = new Builder();

export async function build(...targets: BuildConfiguration[]) {
	if (!targets) throw new Error('Invalid configuration');
	if (!builder.started) await builder.start();

	return await targets.reduce(
		(result, config) => result.then(() => builder.build(config)),

		Promise.resolve()
	);
}

export function exec(cmd: string) {
	return new Observable<void>(subs => {
		builder.log(`sh ${cmd}`, sh(cmd)).then(
			() => subs.complete(),
			e => subs.error(e)
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
