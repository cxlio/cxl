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

/**
 * The `DocGen` interface outlines the configuration structure for generating documentation. It specifies essential
 * options like the output directory, TypeScript configuration, and optional features such as sitemap generation
 * and markdown rendering.
 */
export interface DocGen {
	/**
	 * @description Specifies the output directory where the generated documentation will be saved.
	 * @cli `--outputDir`, `-o`
	 */
	outputDir: string;

	/**
	 * @description URL of the source code repository (e.g., GitHub repository URL).
	 * @cli `--repository`
	 */
	repository?: string;

	/**
	 * @description Link to the repository for the documentation site.
	 * @cli `--repositoryLink`
	 */
	repositoryLink?: string;

	/**
	 * @description Removes all existing files from the output directory before generating documentation.
	 * @cli `--clean`
	 */
	clean: boolean;

	/**
	 * @description Enables debug mode to print detailed output during documentation generation.
	 * @cli `--debug`
	 */
	debug: boolean;

	/**
	 * @description The package information for the current project, typically sourced from `package.json`.
	 * @cli `--packageJson`
	 */
	modulePackage: Package;

	/**
	 * @description Enables Single Page Application (SPA) mode for documentation.
	 * @cli `--spa`
	 */
	spa: boolean;

	/**
	 * @description Path to the `tsconfig.json` file used for TypeScript compilation.
	 * @cli `--tsconfig`
	 */
	tsconfig: string;

	/**
	 * @description Generates a sitemap for the documentation using the provided value as the base URL.
	 * @cli `--sitemap`
	 */
	sitemap?: string;

	/**
	 * @description Path to the `package.json` file. Defaults to `./package.json` if not specified.
	 * @cli `--packageJson`
	 */
	packageJson: string;

	/**
	 * @description The root directory of the package for resolving paths.
	 * @cli `--rootDir`
	 */
	packageRoot: string;

	/**
	 * @description Sets the title of the generated documentation. Defaults to the `name` property in `package.json`.
	 * @cli `--packageName`
	 */
	packageName?: string;

	/**
	 * @description Enables generation of a `summary.json` file.
	 * @cli `--summary`
	 */
	summary: boolean;

	/**
	 * @description Additional sections to include in the documentation.
	 * @cli `--extra`
	 */
	extra?: Section[];

	/**
	 * @description List of additional scripts (paths) to include in the generated documentation HTML.
	 * @cli `--scripts`
	 */
	scripts?: string[];

	/**
	 * @description List of scripts (paths) to include in the generated documentation demo output.
	 * @cli `--demoScripts`
	 */
	demoScripts?: string[];

	/**
	 * @description Allows parsing of specific files instead of an entire project.
	 * @cli `--file`
	 */
	file?: string[];

	/**
	 * @description List of modules (paths) to exclude from documentation generation.
	 * @cli `--exclude`
	 */
	exclude?: string[];

	/**
	 * @description Path to a custom `docs.json` file for configuring documentation generation.
	 * @cli `--docsJson`
	 */
	docsJson?: string;

	/**
	 * @description Enables rendering of markdown syntax within symbol descriptions.
	 * @cli `--markdown`
	 */
	markdown?: boolean;

	/**
	 * @description Sets the base URL for markdown links within the generated documentation.
	 * @cli `--baseHref`
	 */
	baseHref?: string;

	/**
	 * @description Overrides the default root directory used for resolving TypeScript project file names.
	 * @cli `--rootDir`
	 */
	rootDir?: string;

	/**
	 * @description Allows declaration of custom JSDoc tags for documentation.
	 * @cli `--customJsDocTags`
	 */
	customJsDocTags?: string[];

	/**
	 * @description Enables support for Coaxial UI extensions within the generated documentation.
	 * @cli `--cxlExtensions`
	 */
	cxlExtensions?: boolean;

	/**
	 * @description Includes documentation from symbols referenced in project references.
	 * @cli `--followReferences`
	 */
	followReferences?: boolean;

	/**
	 * @description Treats specific symbols (paths) as exported even if not explicitly marked.
	 * @cli `--exports`
	 */
	exports?: string[];

	/**
	 * @description Path to a file containing custom HTML to be added to the `<head>` element of the generated page.
	 * @cli `--headHtml`
	 */
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
