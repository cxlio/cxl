import { Observable, defer, merge, of, from, EMPTY } from '@cxl/rx';
import { existsSync, readFileSync, promises } from 'fs';
import { join } from 'path';
import { file } from './file.js';
import { execSync } from 'child_process';
import { Output } from '@cxl/source';
import { sh } from '@cxl/server';
import { getPublishedVersion } from './npm';
import * as ts from 'typescript';

type License = 'GPL-3.0' | 'GPL-3.0-only' | 'Apache-2.0' | 'UNLICENSED';

export interface Package {
	name: string;
	version: string;
	description: string;
	license: License;
	files: string[];
	main: string;
	bin?: string;
	keywords?: string[];
	browser?: string;
	homepage: string;
	private: boolean;
	bugs: string;
	repository: string;
	dependencies: any;
	peerDependencies: any;
	bundledDependecies: any;
	type: string;
}

const SCRIPTDIR = process.cwd();

export const BASEDIR = execSync(`npm prefix`, { cwd: SCRIPTDIR })
	.toString()
	.trim();

const LICENSE_MAP: Record<License, string> = {
	'GPL-3.0': 'license-GPL-3.0.txt',
	'GPL-3.0-only': 'license-GPL-3.0.txt',
	'Apache-2.0': 'license-Apache-2.0.txt',
	UNLICENSED: '',
};

let PACKAGE: Package;

function verifyFields(fields: string[], pkg: any) {
	for (const f of fields)
		if (!pkg[f]) throw new Error(`Field "${f}" missing in package.json`);
}

export function readPackage(base: string = BASEDIR) {
	if (PACKAGE) return PACKAGE;
	const pkg = base + '/package.json';

	if (!existsSync(pkg)) throw new Error('package.json not found');

	PACKAGE = JSON.parse(readFileSync(pkg, 'utf8'));
	verifyFields(['name', 'version', 'description'], PACKAGE);
	if (!PACKAGE.private) verifyFields(['license'], PACKAGE);
	return PACKAGE;
}

export function docs(dirName: string, devMode = false) {
	const docgen = join(__dirname, '../docgen');
	return new Observable<any>(subs => {
		sh(
			`node ${docgen} --clean ${
				devMode ? '--debug' : ''
			} -o ../docs/${dirName} --summary `
		).then(
			out => (console.log(out), subs.complete()),
			e => subs.error(e)
		);
	});
}

export async function getBranch(cwd: string): Promise<string> {
	return (await sh('git rev-parse --abbrev-ref HEAD', { cwd }))
		.toString()
		.trim();
}

/*function getRepo(repo: string | { url: string }) {
	const branch = execSync('git rev-parse --abbrev-ref HEAD')
		.toString()
		.trim();
	const url = typeof repo === 'string' ? repo : repo.url;
	return url.replace(/\$BRANCH/g, branch);
}*/

function packageJson(p: any) {
	return of({
		path: 'package.json',
		source: Buffer.from(
			JSON.stringify(
				{
					name: p.name,
					version: p.version,
					description: p.description,
					private: p.private,
					license: p.license,
					files: [
						'*.js',
						'*.d.ts',
						'*.js.map',
						'amd/*.js',
						'amd/*.d.ts',
						'amd/*.js.map',
						'es6/*.js',
						'es6/*.d.ts',
						'es6/*.js.map',
						'LICENSE',
						'*.md',
					],
					main: 'index.js',
					browser: p.browser,
					homepage: p.homepage,
					bugs: p.bugs,
					bin: p.bin,
					repository: p.repository,
					dependencies: p.dependencies,
					peerDependencies: p.peerDependencies,
					bundledDependencies: p.bundledDependencies,
					type: p.type,
				},
				null,
				2
			)
		),
	});
}

function license(id: License) {
	if (id === 'UNLICENSED') return EMPTY;
	const licenseFile = LICENSE_MAP[id];
	if (!licenseFile) throw new Error(`Invalid license: "${id}"`);

	return file(join(__dirname, licenseFile), 'LICENSE');
}

function npmLink(pkgName: string, version: string) {
	return `https://npmjs.com/package/${pkgName}/v/${version}`;
}

function readIfExists(file: string) {
	try {
		return readFileSync(file, 'utf8');
	} catch (E) {
		return '';
	}
}

/**
 * Generate README file
 */
export function readme() {
	return defer(() => {
		const pkg = readPackage(BASEDIR);
		const extra = readIfExists('USAGE.md');
		const encodedName = encodeURIComponent(pkg.name);

		return of({
			path: 'README.md',
			source: Buffer.from(`# ${pkg.name} 
	
[![npm version](https://badge.fury.io/js/${encodedName}.svg)](https://badge.fury.io/js/${encodedName})

${pkg.description}

## Project Details

-   Branch Version: [${pkg.version}](${npmLink(pkg.name, pkg.version)})
-   License: ${pkg.license}
-   Documentation: [Link](${pkg.homepage})
-   Report Issues: [Github](${pkg.bugs})

## Installation

	npm install ${pkg.name}

${extra}`),
		});
	});
}

export function pkg() {
	return defer(() => {
		const p = readPackage();
		const licenseId = p.license;

		return from(getPublishedVersion(p.name)).switchMap(version => {
			if (version === p.version)
				throw new Error(
					`Package version ${p.version} already published.`
				);

			const output: Observable<Output>[] = [packageJson(p)];

			output.push(file('README.md', 'README.md'));
			if (licenseId) output.push(license(licenseId));

			return merge(...output);
		});
	});
}

export async function publish() {
	const p = readPackage();
	const isPublished = await getPublishedVersion(p.name);
	if (isPublished) throw new Error(`Package version already published.`);
}

function createBundle(
	files: string[],
	resolvedFiles: string[],
	content: string[],
	outFile: string
): Output {
	const options: ts.CompilerOptions = {
		lib: ['lib.es2017.d.ts'],
		target: ts.ScriptTarget.ES2019,
		module: ts.ModuleKind.AMD,
		allowJs: true,
		declaration: false,
		baseUrl: process.cwd(),
		outDir: process.cwd(),
		outFile: outFile,
		removeComments: true,
		isolatedModules: true,
		moduleResolution: ts.ModuleResolutionKind.NodeJs,
		sourceMap: false,
	};
	const host = ts.createCompilerHost(options);
	const oldGetSourceFile = host.getSourceFile;
	const sourceFiles: ts.SourceFile[] = [];
	host.getSourceFile = function (fn: string, target: ts.ScriptTarget) {
		const i = resolvedFiles.indexOf(fn);

		if (i !== -1) {
			const sf = ts.createSourceFile(
				resolvedFiles[i],
				content[i],
				target
			);
			sf.moduleName = files[i];
			sourceFiles.push(sf);
			return sf;
		}
		return oldGetSourceFile.apply(this, arguments as any);
	};

	const program = ts.createProgram(resolvedFiles, options, host);
	let source = '';
	program.emit(undefined, (_a, b) => (source += b));

	return {
		path: outFile,
		source: Buffer.from(source),
	};
}

export function AMD() {
	return defer<Output>(() =>
		of({
			path: 'amd.js',
			source: readFileSync(__dirname + '/amd.js'),
		})
	);
}

export function bundle(files: Record<string, string>, outFile: string) {
	return new Observable<Output>(subs => {
		const moduleNames = Object.keys(files);
		const resolvedFiles = Object.values(files);
		Promise.all(resolvedFiles.map(f => promises.readFile(f, 'utf8')))
			.then(content => {
				subs.next(
					createBundle(moduleNames, resolvedFiles, content, outFile)
				);
				subs.complete();
			})
			.catch(e => subs.error(e));
	});
}

const INDEX_HEAD = `<!DOCTYPE html><meta charset="utf-8"><script src="index.bundle.min.js"></script>`;
const DEBUG_HEAD = `<!DOCTYPE html><meta charset="utf-8">
<script src="/cxl/dist/tester/require-browser.js"></script>
<script>
	require.replace = function (path) {
		return path.replace(
			/^@cxl\\/(.+)/,
			(str, p1) =>
				\`/cxl/dist/\${str.endsWith('.js') ? p1 : p1 + '/index.js'}\`
		);
	};
	require('@cxl/ui');
	require('@cxl/ui-router');
	require('@cxl/ui-www');
</script>
`;

interface TemplateConfig {
	header: string;
	debugHeader: string;
}

const DefaultTemplateConfig = {
	header: INDEX_HEAD,
	debugHeader: DEBUG_HEAD,
};

export function template(
	filename: string,
	config: Partial<TemplateConfig> = {}
) {
	return file(filename).switchMap(({ source }) => {
		const cfg = { ...DefaultTemplateConfig, ...config };
		return from([
			{ path: 'index.html', source: `${cfg.header}\n${source}` },
			{ path: 'debug.html', source: `${cfg.debugHeader}\n${source}` },
		]);
	});
}
