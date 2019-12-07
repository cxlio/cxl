import { execSync } from 'child_process';
import { dirname } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { of, map, tap, Observable } from '../rx';
import { Application } from '../server';

type Task = Observable<Output>;

declare const process: any;
declare function require(path: string): any;

type PackageTask = object;

interface BuildConfiguration {
	outputDir: string;
	tasks: Task[];
	baseDir?: string;
}

interface Output {
	path: string;
	source: string;
}

function kb(bytes: number) {
	return (bytes / 1000).toFixed(2) + 'kb';
}

interface TypescriptConfig {
	input: string;
	output: string;
	declaration: string;
	amd: boolean;
	compilerOptions: any;
}

const SCRIPTDIR = dirname(process.argv[1]);
const BASEDIR = execSync(`npm prefix`, { cwd: SCRIPTDIR })
	.toString()
	.trim();

let AMD: string;
export function amd() {
	return tap((out: Output) => {
		out.source =
			(AMD || (AMD = readFileSync(__dirname + '/amd.js', 'utf8'))) +
			out.source;
	});
}

export function typescript(config: Partial<TypescriptConfig>) {
	return new Observable<Output>(subs => {
		const tsc = require('./tsc').tsc;
		const options = {
			input: 'index.ts',
			output: 'index.js',
			declaration: 'index.d.ts',
			amd: false,
			compilerOptions: null,
			...config
		};

		const output = tsc(options.input, options.compilerOptions);

		subs.next({
			path: options.output,
			source: output[options.output]
		});

		if (output[options.declaration])
			subs.next({
				path: options.declaration,
				source: output[options.declaration]
			});

		if (output['.tsbuildinfo'])
			subs.next({
				path: '.tsbuildinfo',
				source: output['.tsbuildinfo']
			});

		subs.complete();
	});
}

function readPackage(base: string) {
	try {
		return require(base + '/package.json');
	} catch (e) {
		return {};
	}
}

export function pkg(config: PackageTask) {
	const p = readPackage(BASEDIR);

	return of({
		path: 'package.json',
		source: JSON.stringify({
			name: p.name,
			version: p.version,
			license: p.license,
			files: ['*.js', 'index.d.ts', '*.js.map', 'LICENSE'],
			main: 'index.js',
			homepage: p.homepage,
			bugs: p.bugs,
			repository: p.repository,
			dependencies: p.dependencies,
			peerDependencies: p.peerDependencies,
			...config
		})
	});
}

export class Builder extends Application {
	name = '@cxl/builder';
	baseDir?: string;
	outputDir?: string;
	package: any;

	constructor(public config: BuildConfiguration) {
		super();
	}

	run() {
		return this.parseConfig(this.config);
	}

	writeFile(result: Output) {
		writeFileSync(this.outputDir + '/' + result.path, result.source);
	}

	runTask(task: Task) {
		this.log(
			(output: Output) =>
				`${this.outputDir}/${output.path} ${kb(output.source.length)}`,
			task.pipe(
				map(result => {
					this.writeFile(result);
					return result;
				})
			)
		);
	}

	private parseConfig(config: BuildConfiguration) {
		const baseDir = config.baseDir || BASEDIR;
		const pkg = readPackage(baseDir);
		this.outputDir = config.outputDir || '.';

		if (pkg.name) {
			this.log(`build ${pkg.name} ${pkg.version}`);
		}

		if (baseDir !== process.cwd()) {
			process.chdir(baseDir);
			this.log(`chdir "${baseDir}"`);
		}

		execSync(`mkdir -p ${this.outputDir}`);

		return Promise.all(config.tasks.map(task => this.runTask(task)));
	}
}

export function build(config: BuildConfiguration) {
	return new Builder(config).start();
}
