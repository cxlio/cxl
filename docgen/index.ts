#!/usr/bin/env node
import { promises as fs, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import {
	Package,
	mkdirp,
	program,
	parseArgv,
	readJson,
	sh,
} from '@cxl/program';
import { BuildOptions, Node, build, buildConfig } from '@cxl/dts';

import type { Section } from './render';

export interface File {
	name: string;
	content: string;
	title?: string;
	node?: Node;
}

const Parameters = {
	repository: { type: 'string', help: 'Source code repository' },
	clean: { help: 'Remove all files from output directory' },
	outputDir: { short: 'o', type: 'string', help: 'Output directory' },
	scripts: {
		type: 'string',
		many: true,
		help: 'Extra scripts to include in the documentation html output',
	},
	demoScripts: {
		type: 'string',
		many: true,
		help: 'Scripts to include in the documentation demo output',
	},
	packageJson: {
		help: 'Location of package.json. Defaults to ./package.json',
		type: 'string',
	},
	packageName: {
		help: 'Documentation title. Defaults to package.json name.',
		type: 'string',
	},
	summary: {
		help: 'Render summary.json file',
		type: 'boolean',
	},
	sitemap: {
		help: 'Generate sitemap with the value as base url',
		type: 'string',
	},
	file: {
		help: 'Parse a single file',
		type: 'string',
		many: true,
	},
	tsconfig: {
		help: 'Location of tsconfig file to use. Defaults to ./tsconfig.json',
		type: 'string',
	},
	markdown: {
		help: 'Enable markdown for symbol descriptions',
		type: 'boolean',
	},
	typeRoots: { help: 'Type Roots', type: 'string', many: true },
	docsJson: { help: 'Use docs.json file', type: 'string' },
	baseHref: { help: 'Base href for markdown links', type: 'string' },
	exclude: { help: 'Exclude modules', many: true, type: 'string' },
	rootDir: {
		help: 'Override root directory for typescript project file names',
		type: 'string',
	},
	customJsDocTags: {
		help: 'Declare custom jsdoc tags',
		type: 'string',
		many: true,
	},
	cxlExtensions: {
		help: 'Enable Coaxial UI extensions',
		type: 'boolean',
	},
	exports: {
		help: 'Treat symbol as exported',
		type: 'string',
		many: true,
	},
	followReferences: {
		help: 'Include documentation from project references symbols',
		type: 'boolean',
	},
	headHtml: {
		help: 'File name used to add content to the <head> element of the generated page',
		type: 'string',
	},
} as const;

export interface DocGen {
	outputDir: string;
	repository?: string;
	repositoryLink?: string;
	clean: boolean;
	debug: boolean;
	modulePackage: Package;
	spa: boolean;
	tsconfig: string;
	sitemap?: string;
	packageJson: string;
	packageRoot: string;
	packageName?: string;
	summary: boolean;
	extra?: Section[];
	scripts?: string[];
	demoScripts?: string[];
	file?: string[];
	exclude?: string[];
	docsJson?: string;
	markdown?: boolean;
	baseHref?: string;
	rootDir?: string;
	customJsDocTags?: string[];
	cxlExtensions?: boolean;
	followReferences?: boolean;
	exports?: string[];
	headHtml?: string;
}

program({}, async ({ log }) => {
	const args = {
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

	if (args.docsJson || existsSync('docs.json'))
		Object.assign(args, await readJson(args.docsJson || 'docs.json'));

	async function writeFile(file: File) {
		const name = file.name;
		const out = args.outputDir;
		log(`Writing ${name}${file.node ? ` from ${file.node.name}` : ''}`);
		await Promise.all([fs.writeFile(`${out}/${name}`, file.content)]);
	}

	function doClean(dir: string) {
		return sh(`rm -f ${dir}/*.html ${dir}/*.json ${dir}/*.js`);
	}

	const outputDir = args.outputDir;
	const pkgRepo = await readJson<Package>(args.packageJson);

	args.packageRoot ??= dirname(resolve(args.packageJson));
	await mkdirp(outputDir);
	await mkdirp(outputDir + '/' + pkgRepo.version);

	if (args.clean) {
		await doClean(outputDir);
		await doClean(join(outputDir, pkgRepo.version));
	}

	if (args.repository === undefined && pkgRepo?.repository) {
		const repo = pkgRepo.repository;
		args.repository = typeof repo === 'string' ? repo : repo.url;
	}

	const dtsOptions: BuildOptions = {
		rootDir: args.rootDir,
		exportsOnly: true,
		customJsDocTags: args.customJsDocTags,
		cxlExtensions: args.cxlExtensions || false,
		forceExports: args.exports,
		followReferences: args.followReferences,
	};
	const json = args.file?.length
		? buildConfig(
				{
					compilerOptions: {
						allowJs: true,
						rootDir: dirname(args.file[0]),
						sourceMap: false,
						typeRoots: args.typeRoots || [],
						noEmit: true,
						lib: ['es2021'],
					},
					files: args.file,
				},
				process.cwd(),
				dtsOptions
		  )
		: build(args.tsconfig, dtsOptions);
	log(`Typescript ${json.env.typescript}`);
	const theme = await import('./render-html');

	const docgenConfig: DocGen = {
		...args,
		modulePackage: pkgRepo,
		repositoryLink: args.repository,
	};

	if (args.summary) {
		const summary = await import('./render-summary');
		summary.render(docgenConfig, json).map(f => writeFile(f));
	}

	try {
		await Promise.all(
			theme.render(docgenConfig, json).map(f => writeFile(f))
		);
	} catch (e) {
		console.error(e);
		process.exitCode = 1;
	}
})();
