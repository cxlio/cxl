import { Observable, defer, merge, of, from, fromAsync, EMPTY } from '@cxl/rx';
import { existsSync, readFileSync, promises } from 'fs';
import { join, resolve } from 'path';
import { file } from './file.js';
import { execSync } from 'child_process';
import { Output } from '@cxl/source';
import { sh } from '@cxl/program';
import { exec, run } from './builder.js';
import { License, Package, readPackage as readNpmPackage } from './npm.js';
import * as ts from 'typescript';

const SCRIPTDIR = process.cwd();

export const BASEDIR = execSync(`npm prefix`, { cwd: SCRIPTDIR })
	.toString()
	.trim();

const LICENSE_MAP: Record<License, string> = {
	'GPL-3.0': 'license-GPL-3.0.txt',
	'GPL-3.0-only': 'license-GPL-3.0.txt',
	'Apache-2.0': 'license-Apache-2.0.txt',
	'SEE LICENSE IN LICENSE.txt': '',
	UNLICENSED: '',
};

function verifyFields(fields: string[], pkg: any) {
	for (const f of fields)
		if (!pkg[f]) throw new Error(`Field "${f}" missing in package.json`);
}

export function readPackage(base: string = BASEDIR): Package {
	const pkg = base + '/package.json';

	if (!existsSync(pkg)) throw new Error('package.json not found');

	const PACKAGE = JSON.parse(readFileSync(pkg, 'utf8'));
	verifyFields(['name', 'version', 'description'], PACKAGE);
	if (!PACKAGE.private) verifyFields(['license'], PACKAGE);
	return PACKAGE;
}

export function docs(dirName: string, devMode = false) {
	const docgen = join(__dirname, '../docgen');
	return new Observable<any>(subs => {
		const cmd = `node ${docgen} --clean ${
			devMode ? '--debug' : ''
		} -o ../docs/${dirName} --summary --cxlExtensions`;
		console.log(cmd);
		sh(cmd).then(
			out => (console.log(out), subs.complete()),
			e => subs.error(e)
		);
	});
}

export interface DocgenOptions {
	file: string | string[];
	name: string;
	npm?: string;
	setup?: string;
	repo?: string;
	repodir?: string;
	typeRoots?: string;
	sitemapBase?: string;
	scripts?: string;
	packageJson?: string;
	docsJson?: string;
	cwd?: string;
	forceInstall?: boolean;
	markdown?: boolean;
	baseHref?: string;
	tag: string;
	outDir?: string;
	tmpDir?: string;
	rootDir?: string;
	customJsDocTags?: string[];
	exports?: string[];
	summary?: boolean;
	followReferences?: boolean;
	cxlExtensions?: boolean;
	headHtml?: string;
}

export async function docgen(options: DocgenOptions) {
	const {
		name,
		tag,
		repo,
		file,
		setup,
		npm,
		tmpDir,
		typeRoots,
		scripts,
		sitemapBase,
		packageJson,
		docsJson,
		forceInstall,
		baseHref,
		rootDir,
		customJsDocTags,
		exports,
		summary,
		followReferences,
		cxlExtensions,
		headHtml,
	} = options;
	const repodir =
		options.repodir ||
		`${name.replace('/', '--')}-${tag.replace('/', '--')}`;
	const dir = join(tmpDir || '', repodir, npm ? `/node_modules/${npm}` : ``);
	const cwd = join(dir, options.cwd || '');
	const outDir = resolve(options.outDir || 'docs');
	const files = Array.isArray(file)
		? file.map(f => `--file ${f}`).join(' ')
		: `--tsconfig ${file}`;
	const pkg = join(cwd, packageJson || 'package.json');
	const install = repo
		? `git clone ${repo} --branch=${tag} --depth=1 ${repodir};
cd ${repodir} ${setup ? `&& ${setup}` : ''}`
		: `mkdir -p ${repodir} && npm install --prefix ./${repodir} ${npm}@${tag}`;
	const DOCGEN = join(__dirname, '../docgen');

	if (forceInstall)
		await sh(
			`mkdir -p ${tmpDir} && cd ${tmpDir} && rm -rf ${repodir} && ${install}`
		);
	else
		await sh(`if [ ! -d "${dir}" ]; then
		mkdir -p ${tmpDir} && cd ${tmpDir}
		${install}
	fi`);

	const { description, version } = await readNpmPackage(pkg);
	const sitemap = `${sitemapBase}/${name}/${version}/sitemap.xml`;
	const outputDir = join(outDir, name);

	await run(
		`node ${DOCGEN} ${files}`,
		{
			packageJson,
			docsJson,
			scripts,
			outputDir,
			sitemap: sitemapBase ? `${sitemapBase}/${name}` : '',
			summary: summary ?? true,
			typeRoots,
			packageName: name,
			repository: repo?.startsWith('https')
				? `${repo.replace(/.git$/, '')}/blob/${tag}${
						options.cwd ? `/${options.cwd}` : ''
				  }`
				: undefined,
			markdown: true,
			baseHref,
			customJsDocTags,
			rootDir,
			exports,
			followReferences,
			cxlExtensions,
			headHtml,
		},
		{ cwd }
	);

	return { name, version, description, sitemap };
}

export function docgenTask(
	packages: DocgenOptions[],
	commonOptions?: Partial<DocgenOptions>
) {
	return fromAsync(async () => {
		const output = [];
		for (const p of packages)
			output.push(
				await docgen({
					...commonOptions,
					...p,
				})
			);

		return {
			path: 'docgen.json',
			source: Buffer.from(JSON.stringify(output)),
		};
	});
}

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
					files: p.files || [
						'*.js',
						'*.d.ts',
						'*.css',
						'amd/*.js',
						'amd/*.d.ts',
						'es6/*.js',
						'es6/*.d.ts',
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
	if (id === 'UNLICENSED' || id === 'SEE LICENSE IN LICENSE.txt')
		return EMPTY;
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

		const output: Observable<Output>[] = [packageJson(p)];

		output.push(file('README.md', 'README.md'));
		if (licenseId) output.push(license(licenseId));
		return merge(...output);
	});
}

function createBundle(
	files: string[],
	resolvedFiles: string[],
	content: string[],
	outFile: string,
	config?: ts.CompilerOptions
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
		...config,
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

export function bundle(
	files: Record<string, string>,
	outFile: string,
	config?: ts.CompilerOptions
) {
	return new Observable<Output>(subs => {
		const moduleNames = Object.keys(files);
		const resolvedFiles = Object.values(files);
		Promise.all(resolvedFiles.map(f => promises.readFile(f, 'utf8')))
			.then(content => {
				subs.next(
					createBundle(
						moduleNames,
						resolvedFiles,
						content,
						outFile,
						config
					)
				);
				subs.complete();
			})
			.catch(e => subs.error(e));
	});
}

export const REQUIRE_REPLACE = `
	require.replace = function (path) {
		return path.replace(
			/^@cxl\\/workspace\\.(.+)/,
			(str, p1) =>
				\`/cxl.app/dist/\${str.endsWith('.js') ? p1 : p1 + '/index.js'}\`
		).replace(
			/^@cxl\\/(ui.*)/,
			(str, p1) =>
				\`/ui/dist/\${str.endsWith('.js') ? p1 : p1 + '/index.js'}\`
		).replace(
			/^@cxl\\/(.+)/,
			(str, p1) =>
				\`/cxl/dist/\${str.endsWith('.js') ? p1 : p1 + '/index.js'}\`
		);
	};
`;

const INDEX_HEAD = `<!DOCTYPE html><meta charset="utf-8"><script src="index.bundle.min.js"></script>`;
const DEBUG_HEAD = `<!DOCTYPE html><meta charset="utf-8">
<script src="/cxl/dist/tester/require-browser.js"></script>
<script>
	window.CXL_DEBUG = true;
	${REQUIRE_REPLACE}
	require('@cxl/ui');
	require('@cxl/ui-router');
	require('@cxl/router/debug.js');
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

const HTML_COMMENT_REGEX = /<!--[^]+?-->/gm;

export function template(
	filename: string,
	config: Partial<TemplateConfig> = {}
) {
	return file(filename).switchMap(({ source }) => {
		const prodSource = source
			.toString('utf8')
			.replace(HTML_COMMENT_REGEX, '');
		const cfg = { ...DefaultTemplateConfig, ...config };
		return from([
			{ path: 'index.html', source: `${cfg.header}\n${prodSource}` },
			{ path: 'debug.html', source: `${cfg.debugHeader}\n${source}` },
		]);
	});
}

export interface PublishConfiguration {
	s3Path: string;
	environment: 'dev' | 'prod';
}

export function deployS3({ environment, s3Path }: PublishConfiguration) {
	if (environment !== 'dev' && environment !== 'prod')
		throw new Error(`Invalid environment ${environment}`);

	return exec(
		`aws s3 sync --dryrun --cache-control max-age=60 --content-encoding=utf8 --delete ../dist/debuggerjs.com s3://${s3Path}`
	);
}
