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
	repository: {
		type: 'string',
		help: 'URL of the source code repository (e.g., GitHub repository URL)',
	},
	clean: {
		help: 'Removes all existing files from the output directory before generating documentation.',
	},
	outputDir: {
		short: 'o',
		type: 'string',
		help: 'Specifies the output directory where the generated documentation will be saved.',
	},
	scripts: {
		type: 'string',
		many: true,
		help: 'List of additional scripts (paths) to include in the generated documentation HTML.',
	},
	demoScripts: {
		type: 'string',
		many: true,
		help: 'List of scripts (paths) to include in the generated documentation demo output.',
	},
	packageJson: {
		help: 'Path to the package.json file. Defaults to "./package.json" if not specified.',
		type: 'string',
	},
	packageName: {
		help: 'Sets the title of the generated documentation. Defaults to the name property in package.json.',
		type: 'string',
	},
	summary: {
		help: 'Enables generation of a "summary.json" file.',
		type: 'boolean',
	},
	sitemap: {
		help: 'Generates a sitemap for the documentation using the provided value as the base URL.',
		type: 'string',
	},
	file: {
		help: 'Allows parsing of a single file instead of an entire project.',
		type: 'string',
		many: true,
	},
	tsconfig: {
		help: 'Path to the tsconfig.json file used for TypeScript compilation. Defaults to "./tsconfig.json" if not specified.',
		type: 'string',
	},
	markdown: {
		help: 'Enables rendering of markdown syntax within symbol descriptions.',
		type: 'boolean',
	},
	typeRoots: {
		help: 'Specify additional type root directories (paths) for TypeScript projects (can be used multiple times).',
		type: 'string',
		many: true,
	},
	docsJson: {
		help: 'Path to a custom "docs.json" file for configuring documentation generation.',
		type: 'string',
	},
	baseHref: {
		help: 'Sets the base URL for markdown links within the generated documentation.',
		type: 'string',
	},
	exclude: {
		help: 'List of modules (paths) to exclude from documentation generation (can be used multiple times).',
		type: 'string',
		many: true,
	},
	rootDir: {
		help: 'Overrides the default root directory used for resolving TypeScript project file names.',
		type: 'string',
	},
	customJsDocTags: {
		help: 'Allows declaration of custom jsdoc tags for documentation (can be used multiple times).',
		type: 'string',
		many: true,
	},
	cxlExtensions: {
		help: 'Enables support for Coaxial UI extensions within the generated documentation.',
		type: 'boolean',
	},
	exports: {
		help: 'Treats specific symbols (paths) as exported even if not explicitly marked.',
		type: 'string',
		many: true,
	},
	followReferences: {
		help: 'Includes documentation from symbols referenced in project references.',
		type: 'boolean',
	},
	headHtml: {
		help: 'Path to a file containing custom HTML to be added to the `<head>` element of the generated page.',
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
				dtsOptions,
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
			theme.render(docgenConfig, json).map(f => writeFile(f)),
		);
	} catch (e) {
		console.error(e);
		process.exitCode = 1;
	}
})();
