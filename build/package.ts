import { Observable, defer, merge, of } from '../rx';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { file } from './file.js';
import { execSync } from 'child_process';
import { Output } from '../source/index.js';
import { sh } from '../server';

type License = 'GPL-3.0' | 'GPL-3.0-only' | 'Apache-2.0';

export interface Package {
	name: string;
	version: string;
	description: string;
	license: License;
	files: string[];
	main: string;
	homepage: string;
	private: boolean;
	bugs: string;
	repository: string;
	dependencies: any;
	peerDependencies: any;
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
};

let PACKAGE: Package;

function verifyFields(fields: string[], pkg: any) {
	for (const f of fields)
		if (!pkg[f]) throw new Error(`Field ${f} missing in package.json`);
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
	const branch = 'master';
	return new Observable<any>(subs => {
		sh(
			`node ../dist/docgen --clean ${
				devMode ? '--debug' : ''
			} -o ../docs/${dirName} --repository "https://github.com/cxlio/cxl/tree/${branch}/${dirName}"`
		).then(
			out => (console.log(out), subs.complete()),
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

function packageJson(p: any) {
	return of({
		path: 'package.json',
		source: JSON.stringify(
			{
				name: p.name,
				version: p.version,
				description: p.description,
				license: p.license,
				files: ['*.js', '*.d.ts', '*.js.map', 'LICENSE', '*.md'],
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
	});
}

function getPublishedVersion(p: Package) {
	try {
		return execSync(`npm show ${p.name}@${p.version} version`, {
			encoding: 'utf8',
			stdio: ['ignore', 'inherit', 'ignore'],
		}).trim();
	} catch (e) {
		return;
	}
}

function license(id: License) {
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
			source: `# ${pkg.name} 
	
[![npm version](https://badge.fury.io/js/${encodedName}.svg)](https://badge.fury.io/js/${encodedName})

${pkg.description}

## Project Details

-   Branch Version: [${pkg.version}](${npmLink(pkg.name, pkg.version)})
-   License: ${pkg.license}
-   Documentation: [Link](${pkg.homepage})

## Installation

	npm install ${pkg.name}

${extra}`,
		});
	});
}

export function pkg() {
	return defer(() => {
		const p = readPackage();
		const licenseId = p.license;
		const isPublished = getPublishedVersion(p);

		if (isPublished) throw new Error(`Package version already published.`);

		const output: Observable<Output>[] = [packageJson(p)];

		output.push(file('README.md', 'README.md'));

		if (!licenseId) throw new Error('license field is required.');

		output.push(license(licenseId));

		return merge(...output);
	});
}

export function publish() {
	const p = readPackage();
	const isPublished = getPublishedVersion(p);
	if (isPublished) throw new Error(`Package version already published.`);
}