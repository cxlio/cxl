import { execSync } from 'child_process';
import { dirname } from 'path';
import { readFileSync, writeFileSync } from 'fs';
// import * as UglifyJS from 'uglify-es';
import { of, from, map, Observable } from '../rx';
import { Application } from '../server';

type Task = (builder: Builder) => Observable<Output>;

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

type Targets = { [name: string]: (...p: any) => Task };

function kb(bytes: number) {
	return (bytes / 1000).toFixed(2) + 'kb';
}

let AMD: string;
function getAMD() {
	return AMD || (AMD = readFileSync('amd.js', 'utf8'));
}

interface TypescriptConfig {
	input: string;
	output: string;
	declaration: string;
	amd: boolean;
	compilerOptions: any;
}

/*export function amd() {
	const AMD = getAMD();
}*/

export const targets: Targets = {
	typescript(config: Partial<TypescriptConfig>) {
		const tsc = require('./tsc').tsc;
		const options = {
			input: 'index.ts',
			output: 'index.js',
			declaration: 'index.d.ts',
			amd: false,
			compilerOptions: null,
			...config
		};

		return () => {
			const output = tsc(options.input, options.compilerOptions);
			const result = [
				{
					path: options.output,
					source: output[options.output]
				}
			];

			if (output[options.declaration])
				result.push({
					path: options.declaration,
					source: output[options.declaration]
				});

			if (output['.tsbuildinfo'])
				result.push({
					path: '.tsbuildinfo',
					source: output['.tsbuildinfo']
				});

			return from(result);
		};
	},

	package(config: PackageTask) {
		return b => {
			const pkg = b.package;

			return of({
				path: 'package.json',
				source: JSON.stringify({
					name: pkg.name,
					version: pkg.version,
					license: pkg.license,
					files: ['*.js', 'index.d.ts', '*.js.map', 'LICENSE'],
					main: 'index.js',
					homepage: pkg.homepage,
					bugs: pkg.bugs,
					repository: pkg.repository,
					dependencies: pkg.dependencies,
					peerDependencies: pkg.peerDependencies,
					...config
				})
			});
		};
	}
};

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
			task(this).pipe(
				map(result => {
					this.writeFile(result);
					return result;
				})
			)
		);
	}

	private findBase() {
		const SCRIPTDIR = dirname(process.argv[1]);
		return execSync(`npm prefix`, { cwd: SCRIPTDIR })
			.toString()
			.trim();
	}

	private readPackage(base: string) {
		try {
			return require(base + '/package.json');
		} catch (e) {
			return {};
		}
	}

	private parseConfig(config: BuildConfiguration) {
		const baseDir = (this.baseDir = config.baseDir || this.findBase());
		const pkg = (this.package = this.readPackage(baseDir));
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
