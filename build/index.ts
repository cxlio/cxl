import {
	dirname,
	resolve,
	basename as pathBasename,
	join,
	relative,
} from 'path';
import {
	mkdirSync,
	readFileSync,
	writeFileSync,
	promises,
	existsSync,
} from 'fs';
import {
	defer,
	from,
	map,
	tap,
	Observable,
	Operator,
	operator,
	of,
	merge,
} from '../rx/index.js';
import { tsbuild, tscVersion } from './tsc.js';
import { Application } from '../server/index.js';
import * as Terser from 'terser';
import { execSync } from 'child_process';
import { ESLint } from 'eslint';

export { concat } from '../rx/index.js';
export { tsc } from './tsc.js';

type Task = Observable<Output>;
interface PackageTask {
	license?: string;
}

interface BuildConfiguration {
	outputDir: string;
	tasks: Task[];
	baseDir?: string;
}

export interface Output {
	path: string;
	source: string;
}

function kb(bytes: number) {
	return (bytes / 1000).toFixed(2) + 'kb';
}

const SCRIPTDIR = dirname(process.argv[1]);
const BASEDIR = execSync(`npm prefix`, { cwd: SCRIPTDIR }).toString().trim();

let AMD: string;
export function amd() {
	return tap((out: Output) => {
		out.source =
			(AMD || (AMD = readFileSync(__dirname + '/amd.js', 'utf8'))) +
			out.source;
	});
}

function handleEslintResult(results: ESLint.LintResult[]) {
	const result: Output[] = [];
	let hasErrors = false;

	results.forEach(result => {
		const errorCount = result.errorCount; // - result.fixableErrorCount;
		if (errorCount) {
			hasErrors = true;
			const file = relative(process.cwd(), result.filePath);
			result.messages.forEach(
				r =>
					!r.fix &&
					console.log(`${file}#${r.line}:${r.column}: ${r.message}`)
			);
		}
	});
	if (hasErrors) throw new Error('eslint errors found.');

	return result;
}

export function eslint(options: any) {
	return new Observable<Output>(subs => {
		const linter = new ESLint({
			cache: true,
			fix: true,
			...options,
		});
		linter
			.lintFiles(['**/*.ts'])
			.then(handleEslintResult)
			.then(
				() => subs.complete(),
				e => subs.error(e)
			);
	});
}

export function tsconfig(tsconfig = 'tsconfig.json') {
	return new Observable<Output>(subs => {
		tsbuild(tsconfig, subs);
		subs.complete();
	});
}

function readPackage(base: string) {
	const pkg = base + '/package.json';
	return existsSync(pkg) && JSON.parse(readFileSync(pkg, 'utf8'));
}

export function read(source: string): Promise<Output> {
	return promises.readFile(source, 'utf8').then(content => ({
		path: source,
		source: content,
	}));
}

export function file(source: string, out?: string) {
	return defer(() =>
		from(
			read(source).then(res => ({
				path: out || resolve(source),
				source: res.source,
			}))
		)
	);
}

/**
 * Reads multiple files asynchronously and emits them in order
 */
export function files(sources: string[]) {
	return new Observable<Output>(subs => {
		Promise.all(sources.map(read)).then(
			out => {
				out.forEach(o => subs.next(o));
				subs.complete();
			},
			e => subs.error(e)
		);
	});
}

function getRepo(repo: string | { url: string }) {
	const branch = execSync('git rev-parse --abbrev-ref HEAD')
		.toString()
		.trim();
	const url = typeof repo === 'string' ? repo : repo.url;
	return url.replace(/\$BRANCH/g, branch);
}

const LICENSE_MAP: Record<string, string> = {
	'GPL-3.0': 'license-GPL-3.0.txt',
	'GPL-3.0-only': 'license-GPL-3.0.txt',
	'Apache-2.0': 'license-Apache-2.0.txt',
};

export function pkg(config: PackageTask = {}) {
	return defer(() => {
		const p = readPackage(BASEDIR);
		const license = p.license || config.license;
		const publishedVersion = execSync(`npm show ${p.name} version`, {
			encoding: 'utf8',
		});

		if (publishedVersion === p.version)
			throw new Error(
				`Package version must be different than published version (${publishedVersion})`
			);

		const output: Observable<Output>[] = [
			of({
				path: 'package.json',
				source: JSON.stringify(
					{
						name: p.name,
						version: p.version,
						license,
						files: [
							'*.js',
							'*.d.ts',
							'*.js.map',
							'LICENSE',
							'*.md',
						],
						main: 'index.js',
						homepage: p.homepage,
						bugs: p.bugs,
						repository: p.repository && getRepo(p.repository),
						dependencies: p.dependencies,
						peerDependencies: p.peerDependencies,
						type: p.type,
					},
					null,
					2
				),
			}),
		];

		output.push(file('README.md', 'README.md'));

		if (!license) throw new Error('license field is required.');
		if (!LICENSE_MAP[license])
			throw new Error(`Invalid license: "${license}"`);

		output.push(file(join(__dirname, LICENSE_MAP[license]), 'LICENSE'));

		return merge(...output);
	});
}

export function umd(namespace = 'this') {
	return map((outFile: Output) => {
		outFile.source = `(exports=>{${outFile.source}\n})(typeof(exports)==='undefined'?${namespace}:exports);`;
		return outFile;
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

type TaskList = {
	[name: string]: (...args: any) => Task;
};
type OperatorList = {
	[name: string]: (...args: any) => Operator<Output>;
};

export const tasks: TaskList = {
	pkg,
	file,
};

export const operators: OperatorList = {
	amd,
	basename,
	prepend,
};

export class Builder extends Application {
	name = '@cxl/build';
	baseDir?: string;
	outputDir = '';
	package: any;
	hasErrors = false;

	constructor(public config: BuildConfiguration) {
		super();
	}

	async run() {
		try {
			return await this.parseConfig(this.config);
		} catch (e) {
			this.log(e);
			throw 'Build finished with errors';
		}
	}

	writeFile(result: Output) {
		const outFile = join(this.outputDir, result.path);
		const outputDir = dirname(outFile);

		if (!existsSync(outputDir)) mkdirSync(outputDir);

		writeFileSync(this.outputDir + '/' + result.path, result.source);
	}

	runTask(task: Task) {
		return this.log(
			(output: Output) =>
				`${join(this.outputDir, output.path)} ${kb(
					(output.source || '').length
				)}`,
			task.pipe(tap(result => this.writeFile(result)))
		);
	}

	private parseConfig(config: BuildConfiguration) {
		const baseDir = config.baseDir || BASEDIR;
		const pkg = readPackage(baseDir);
		this.outputDir = config.outputDir || '.';

		if (pkg.name) this.log(`build ${pkg.name} ${pkg.version}`);
		this.log(`typescript ${tscVersion}`);

		if (baseDir !== process.cwd()) {
			process.chdir(baseDir);
			this.log(`chdir "${baseDir}"`);
		}

		execSync(`mkdir -p ${this.outputDir}`);

		return Promise.all(config.tasks.map(task => this.runTask(task)));
	}
}

export function build(
	targetOrConfig: string | BuildConfiguration,
	config?: BuildConfiguration
) {
	if (typeof targetOrConfig !== 'string') config = targetOrConfig;
	else if (!process.argv.includes(targetOrConfig)) return Promise.resolve();

	if (!config) throw new Error('Invalid configuration');

	return new Builder(config).start();
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
	return operator(subs => (out: Output) => {
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

		subs.next({ path: destPath, source: code });
		if (map && config.sourceMap)
			subs.next({ path: config.sourceMap.url, source: map });
	});
}
