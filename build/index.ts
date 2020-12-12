import * as Terser from 'terser';
import {
	EMPTY,
	Observable,
	defer,
	operator,
	tap,
	pipe,
	reduce,
	map,
} from '../rx/index.js';
import {
	dirname,
	join,
	basename as pathBasename,
	relative,
	resolve,
} from 'path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

import { BASEDIR, Package, docs, pkg, readPackage, readme } from './package.js';
import { BuildOptions, tsbuild, tscVersion } from './tsc.js';
import { Application, sh } from '../server/index.js';
import { ESLint } from 'eslint';
import { execSync } from 'child_process';
import { Output } from '../source/index.js';
import { file } from './file.js';

export { file, files, copyDir } from './file.js';
export { concat } from '../rx/index.js';
export { AMD, pkg, readme, bundle } from './package.js';
export { sh } from '../server/index.js';

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
				console.error(
					`${file}#${r.line}:${r.column}: ${r.message} (${r.ruleId})`
				)
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
		builder.log(`eslint ${ESLint.version}`);
		builder.log(
			`eslint`,
			linter
				.lintFiles(['**/*.ts?(x)'])
				.then(handleEslintResult)
				.then(
					() => subs.complete(),
					e => subs.error(e)
				)
		);
	});
}

export function tsconfig(tsconfig = 'tsconfig.json', options?: BuildOptions) {
	return new Observable<Output>(subs => {
		tsbuild(tsconfig, subs, options);
		subs.complete();
	});
}

export function basename(replace?: string) {
	return tap<Output>(
		out => (out.path = (replace || '') + pathBasename(out.path))
	);
}

export function prepend(str: string) {
	return tap((val: Output) => (val.source = str + val.source));
}

export function concatFile(outName: string) {
	return pipe(
		reduce<Output, string>((out, src) => out + src.source, ''),
		map(source => ({ path: outName, source }))
	);
}

export function buildCxl(...extra: BuildConfiguration[]) {
	const packageJson = readPackage();
	const cwd = process.cwd();
	const tsconfigFile = require(cwd + '/tsconfig.json');
	const outputDir = tsconfigFile?.compilerOptions?.outDir;
	if (!outputDir) throw new Error('No outDir field set in tsconfig.json');

	const dirName = pathBasename(outputDir);
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
			tasks: [readme()],
		},
		{
			target: 'docs-dev',
			outputDir: '.',
			tasks: [readme()],
		},
		{
			target: 'docs',
			outputDir: '.',
			tasks: [docs(dirName)],
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
				eslint({ resolvePluginsRelativeTo: __dirname }),
				packageJson.browser
					? file(`${outputDir}/index.js`).pipe(minify())
					: EMPTY,
				pkg(),
			],
		},
		...(existsSync('tsconfig.amd.json')
			? [
					{
						target: 'package',
						outputDir: outputDir + '/amd',
						tasks: [
							tsconfig('tsconfig.amd.json'),
							packageJson.browser
								? file(`${outputDir}/amd/index.js`).pipe(
										minify()
								  )
								: EMPTY,
						],
					},
			  ]
			: []),
		...(existsSync('tsconfig.es6.json')
			? [
					{
						target: 'package',
						outputDir: outputDir + '/es6',
						tasks: [
							tsconfig('tsconfig.es6.json'),
							packageJson.browser
								? file(`${outputDir}/es6/index.js`).pipe(
										minify()
								  )
								: EMPTY,
						],
					},
			  ]
			: []),
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
			task.tap(result => this.writeFile(result))
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

	return await targets.reduce(
		(result, config) =>
			result.then(() => {
				builder.build(config);
			}),

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

export function exec(cmd: string) {
	return new Observable<void>(subs => {
		builder.log(`sh ${cmd}`, sh(cmd)).then(
			() => subs.complete(),
			e => subs.error(e)
		);
	});
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
