import * as Terser from 'terser';
import { Observable, defer, operator, tap } from '../rx/index.js';
import {
	dirname,
	join,
	basename as pathBasename,
	relative,
	resolve,
} from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

import { BASEDIR, Package, docs, pkg, readPackage, readme } from './package.js';
import { tsbuild, tscVersion } from './tsc.js';
import { Application } from '../server/index.js';
import { ESLint } from 'eslint';
import { execSync } from 'child_process';
import { Output } from '../source';
import { file } from './file.js';

export { file, files } from './file.js';
export { concat } from '../rx/index.js';
export { tsc } from './tsc.js';
export { pkg, readme } from './package.js';
export { sh } from '../server';

type Task = Observable<Output>;

interface BuildConfiguration {
	target?: string;
	outputDir: string;
	tasks: Task[];
}

function kb(bytes: number) {
	return (bytes / 1000).toFixed(2) + 'kb';
}

function handleEslintResult(results: ESLint.LintResult[]) {
	const result: Output[] = [];
	let hasErrors = false;

	results.forEach(result => {
		const errorCount = result.errorCount;
		const file = relative(process.cwd(), result.filePath);

		builder.log(`eslint ${file}`);
		if (errorCount) {
			hasErrors = true;
			result.messages.forEach(r =>
				console.log(`${file}#${r.line}:${r.column}: ${r.message}`)
			);
		}
	});
	if (hasErrors) throw new Error('eslint errors found.');

	return result;
}

export function eslint(options?: any) {
	return new Observable<Output>(subs => {
		const linter = new ESLint({
			cache: true,
			cwd: process.cwd(),
			// fix: true,
			...options,
		});
		builder.log(
			`eslint`,
			linter
				//.lintFiles(['**/*.ts?(x)', '**/*.tsx'])
				.lintFiles(['**/*.ts?(x)'])
				.then(handleEslintResult)
				.then(
					() => subs.complete(),
					e => subs.error(e)
				)
		);
	});
}

export function tsconfig(tsconfig = 'tsconfig.json') {
	return new Observable<Output>(subs => {
		tsbuild(tsconfig, subs);
		subs.complete();
	});
}

interface BundleOptions {
	header?: string;
	footer?: string;
}

export function bundle(outFile: string, options?: BundleOptions) {
	const output = {
		[outFile]: { path: outFile, source: options?.header || '' },
	};
	return operator<Output>(subs => ({
		next(out) {
			if (/.js$/.test(out.path))
				output[outFile].source += out.source + '\n';
		},
		complete() {
			if (options && options.footer)
				output[outFile].source += options.footer;

			for (const i in output) subs.next(output[i]);
		},
	}));
}

export function basename(replace?: string) {
	return tap<Output>(
		out => (out.path = (replace || '') + pathBasename(out.path))
	);
}

export function prepend(str: string) {
	return tap((val: Output) => (val.source = str + val.source));
}

export function buildCxl(...extra: BuildConfiguration[]) {
	const packageJson = readPackage();
	const dirName = packageJson.name.split('/')[1];
	const outputDir = `../dist/${dirName}`;

	return build(
		{
			target: 'clean',
			outputDir,
			tasks: [
				defer(() => {
					execSync(`rm -rf ${outputDir}`);
				}),
			],
		},
		{
			outputDir,
			tasks: [tsconfig('tsconfig.test.json')],
		},
		{
			target: 'docs',
			outputDir: '.',
			tasks: [docs(dirName), readme()],
		},
		{
			target: 'docs-dev',
			outputDir: '.',
			tasks: [docs(dirName, true)],
		},
		{
			target: 'package',
			outputDir,
			tasks: [
				eslint(),
				file(`${outputDir}/index.js`).pipe(minify()),
				pkg(),
			],
		},
		...extra
	);
}

class Build {
	outputDir: string;

	constructor(private builder: Builder, private config: BuildConfiguration) {
		this.outputDir = config.outputDir || '.';
	}

	private writeFile(result: Output) {
		const outFile = join(this.outputDir, result.path);
		const outputDir = dirname(outFile);

		if (!existsSync(outputDir)) mkdirSync(outputDir);

		writeFileSync(this.outputDir + '/' + result.path, result.source);
	}

	private runTask(task: Task) {
		return this.builder.log(
			(output: Output) =>
				`${join(this.outputDir, output.path)} ${kb(
					(output.source || '').length
				)}`,
			task.pipe(tap(result => this.writeFile(result)))
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
			this.builder.log(e);
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

const builder = new Builder();

export async function build(...targets: BuildConfiguration[]) {
	if (!targets) throw new Error('Invalid configuration');
	if (!builder.started) await builder.start();
	return targets.reduce(
		(result, config) => result.then(() => builder.build(config)),
		Promise.resolve()
	);
}

interface MinifyConfig {
	sourceMap?: { content?: string; url: string };
}

export function getSourceMap(out: Output): Output | undefined {
	const match = /\/\/# sourceMappingURL=(.+)/.exec(out.source);
	const path = match ? resolve(dirname(out.path), match?.[1]) : null;

	if (path)
		return { path: pathBasename(path), source: readFileSync(path, 'utf8') };
}

export function minify(config: MinifyConfig = {}) {
	return operator<Output>(subs => (out: Output) => {
		const destPath = pathBasename(out.path.replace(/\.js$/, '.min.js'));

		// Detect sourceMap if not present in config
		if (!config.sourceMap) {
			const sourceMap = getSourceMap(out);
			if (sourceMap)
				config.sourceMap = {
					content: sourceMap.source,
					url: destPath + '.map',
				};
		}

		const { code, map, error } = Terser.minify(out.source, config);

		if (error) throw error;
		if (!code) throw new Error('No code generated');

		subs.next({ path: destPath, source: code });
		if (map && config.sourceMap)
			subs.next({ path: config.sourceMap.url, source: map.toString() });
	});
}

if (require.main?.filename === __filename) buildCxl();
