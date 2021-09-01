#!/usr/bin/env node
import { promises as fs, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import {
	Parameter,
	mkdirp,
	program,
	parseArgv,
	parametersJsonFile,
	readJson,
	sh,
} from '@cxl/program';
import { Node, build, buildConfig } from '@cxl/dts';

//import { render as renderJson } from './render-json';
import type { Section } from './render';

const RUNTIME_JS = __dirname + '/runtime.bundle.min.js';
const STYLES_CSS = __dirname + '/styles.css';
const DotGitRegex = /\.git$/;

export interface File {
	name: string;
	content: string;
	title?: string;
	node?: Node;
}

const Parameters: Parameter[] = [
	{ name: 'repository', type: 'string' },
	{ name: 'clean', help: 'Remove all files from output directory' },
	{ name: 'outputDir', short: 'o', type: 'string' },
	{
		name: 'scripts',
		help: 'Extra scripts to include in the documentation html output',
	},
	{
		name: 'demoScripts',
		help: 'Scripts to include in the documentation demo output',
	},
	{
		name: 'packageJson',
		help: 'Location of package.json. Defaults to ./package.json',
		type: 'string',
	},
	{
		name: 'summary',
		help: 'Render summary.json file',
	},
	{
		name: 'file',
		help: 'Parse a single file',
		type: 'string',
	},
	{
		name: 'tsconfig',
		help: 'Location of tsconfig file to use. Defaults to ./tsconfig.json',
		type: 'string',
	},
	{ name: 'extra', help: 'Extra documentation files' },
	{ name: 'spa', help: 'Enable single page application mode' },
	{ name: 'debug' },
];

export interface DocGen {
	outputDir: string;
	repository?: string;
	repositoryLink?: string;
	clean: boolean;
	debug: boolean;
	modulePackage?: any;
	spa: boolean;
	tsconfig: string;
	packageJson: string;
	packageRoot: string;
	summary: boolean;
	extra?: Section[];
	scripts?: string[];
	file?: string;
}

program({}, async ({ log }) => {
	const args: DocGen = {
		outputDir: './docs',
		clean: false,
		debug: false,
		spa: true,
		tsconfig: 'tsconfig.json',
		packageJson: 'package.json',
		packageRoot: '',
		summary: false,
		...parseArgv(Parameters),
	};

	if (existsSync('docs.json'))
		Object.assign(args, parametersJsonFile(Parameters, 'docs.json'));

	async function writeFile(file: File) {
		const name = file.name;
		const out = args.outputDir;
		const version = args.modulePackage.version;
		log(`Writing ${name}${file.node ? ` from ${file.node.name}` : ''}`);
		await Promise.all([
			fs.writeFile(`${out}/${name}`, file.content),
			fs.writeFile(`${out}/${version}/${name}`, file.content),
		]);
	}

	function doClean(dir: string) {
		return sh(`rm -f ${dir}/*.html ${dir}/*.json ${dir}/*.js`);
	}

	const outputDir = args.outputDir;
	const pkgRepo = (args.modulePackage = await readJson(args.packageJson));
	args.packageRoot = dirname(resolve(args.packageJson));
	await mkdirp(outputDir);
	await mkdirp(outputDir + '/' + pkgRepo.version);

	if (args.clean) {
		await doClean(outputDir);
		await doClean(join(outputDir, pkgRepo.version));
	}

	if (!args.repository && pkgRepo?.repository) {
		const repo = pkgRepo.repository;
		args.repository = typeof repo === 'string' ? repo : repo.url;
	}
	if (args.repository) {
		const repo = pkgRepo.repository;
		const url = args.repository;
		if (url?.indexOf('github.com') !== -1) {
			args.repositoryLink =
				url.replace(DotGitRegex, '') +
				join('/blob/master', repo.directory || '');
		}
	}

	const json = args.file
		? buildConfig(
				{
					compilerOptions: {
						allowJs: true,
						rootDir: dirname(args.file),
					},
					files: [args.file],
				},
				process.cwd()
		  )
		: build(args.tsconfig);
	const theme = await import('./render-html');
	// renderJson(this, json).map(f => this.writeFile(f));

	if (args.summary) {
		const summary = await import('./render-summary');
		summary.render(args, json).map(f => writeFile(f));
	}

	try {
		await Promise.all(theme.render(args, json).map(f => writeFile(f)));
		await writeFile({
			name: 'styles.css',
			content: await fs.readFile(STYLES_CSS, 'utf8'),
		});
		await writeFile({
			name: 'runtime.bundle.min.js',
			content: await fs.readFile(RUNTIME_JS, 'utf8'),
		});
	} catch (e) {
		console.error(e);
		process.exitCode = 1;
	}
})();
