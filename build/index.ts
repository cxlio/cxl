import { execSync } from 'child_process';
import { dirname, basename as pathBasename, join } from 'path';
import {
	mkdirSync,
	readFileSync,
	writeFileSync,
	promises,
	existsSync
} from 'fs';
import { of, map, tap, Observable, Operator, operator } from '../rx/index.js';
import { Application } from '../server/index.js';
import { tsbuild, tscVersion } from './tsc.js';

export { concat } from '../rx/index.js';

type Task = Observable<Output>;
type PackageTask = object;

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

export function tsconfig(tsconfig = 'tsconfig.json') {
	return new Observable<Output>(subs => {
		const output = tsbuild(tsconfig);

		output.forEach(out => {
			subs.next(out);
		});

		subs.complete();
	});
}

function readPackage(base: string) {
	const pkg = base + '/package.json';
	return existsSync(pkg) && JSON.parse(readFileSync(pkg, 'utf8'));
}

function readSource(source: string): Promise<Output> {
	return promises.readFile(source, 'utf8').then(content => ({
		path: source,
		source: content
	}));
}

export function file(source: string | string[], out?: string) {
	return new Observable<Output>(subs => {
		function emit(filename: string): Promise<void> {
			return promises.readFile(filename, 'utf8').then((content: string) =>
				subs.next({
					path: out || pathBasename(filename),
					source: content
				})
			);
		}

		if (typeof source === 'string')
			emit(source).then(() => subs.complete());
		else
			Promise.all<Output>(source.map(readSource)).then(all => {
				all.forEach(out => subs.next(out));
				subs.complete();
			});
	});
}

export function pkg(config: PackageTask) {
	const p = readPackage(BASEDIR);

	return of({
		path: 'package.json',
		source: JSON.stringify({
			name: p.name,
			version: p.version,
			license: p.license,
			files: ['*.js', '*.d.ts', '*.js.map', 'LICENSE'],
			main: 'index.js',
			homepage: p.homepage,
			bugs: p.bugs,
			repository: p.repository,
			dependencies: p.dependencies,
			peerDependencies: p.peerDependencies,
			type: p.type,
			...config
		})
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
		[outFile]: { path: outFile, source: (options && options.header) || '' }
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
		}
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
	file
};

export const operators: OperatorList = {
	amd,
	basename,
	prepend
};

export class Builder extends Application {
	name = '@cxl/builder';
	baseDir?: string;
	outputDir = '';
	package: any;
	hasErrors = false;

	constructor(public config: BuildConfiguration) {
		super();
	}

	run() {
		const result = this.parseConfig(this.config).catch(error => {
			this.hasErrors = true;
			this.log(error);
		});

		if (this.hasErrors) throw 'Build finished with errors';

		return result;
	}

	writeFile(result: Output) {
		const outFile = this.outputDir + '/' + result.path;
		const outputDir = dirname(outFile);

		if (!existsSync(outputDir)) mkdirSync(outputDir);

		writeFileSync(this.outputDir + '/' + result.path, result.source);
	}

	runTask(task: Task) {
		this.log(
			(output: Output) =>
				`${join(this.outputDir, output.path)} ${kb(
					(output.source || '').length
				)}`,
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
		this.log(`typescript ${tscVersion}`);

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
