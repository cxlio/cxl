import { promises as fs, existsSync } from 'fs';
import { join } from 'path';

import { Application, mkdirp, readJson, sh } from '@cxl/server';
import { Node, build } from '@cxl/dts';

import { render as renderJson } from './render-json';
import type { Section } from './render';

const RUNTIME_JS = __dirname + '/runtime.bundle.min.js';
const STYLES_CSS = __dirname + '/styles.css';

export interface File {
	name: string;
	content: string;
	title?: string;
	node?: Node;
}

export class DocGen extends Application {
	name = '@cxl/docgen';
	outputDir = './docs';
	repository?: string;

	clean = false;
	debug = false;
	modulePackage?: any;
	spa = true;
	tsconfig = 'tsconfig.json';
	packageJson = 'package.json';
	summary = false;
	extra?: Section[];
	scripts?: string[];

	setup() {
		this.parameters.register(
			{ name: 'repository', type: 'string' },
			{ name: 'clean', help: 'Remove all files from output directory' },
			{ name: 'outputDir', shortcut: 'o', type: 'string' },
			{
				name: 'scripts',
				help:
					'Extra scripts to include in the documentation html output',
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
				name: 'tsconfig',
				help:
					'Location of tsconfig file to use. Defaults to ./tsconfig.json',
				type: 'string',
			},
			{ name: 'extra', help: 'Extra documentation files' },
			{ name: 'spa', help: 'Enable single page application mode' },
			{ name: 'debug' }
		);

		if (existsSync('docs.json')) this.parameters.parseJsonFile('docs.json');
	}

	writeFile(file: File) {
		const name = file.name;
		const out = this.outputDir;
		const version = this.modulePackage.version;
		return this.log(
			`Writing ${name}${file.node ? ` from ${file.node.name}` : ''}`,
			() =>
				Promise.all([
					fs.writeFile(`${out}/${name}`, file.content),
					fs.writeFile(`${out}/${version}/${name}`, file.content),
				])
		);
	}

	private doClean(dir: string) {
		return sh(`rm -f ${dir}/*.html ${dir}/*.json ${dir}/*.js`);
	}

	async run() {
		const outputDir = this.outputDir;
		const pkgRepo = (this.modulePackage = await readJson(this.packageJson));
		await mkdirp(outputDir);
		await mkdirp(outputDir + '/' + pkgRepo.version);

		if (this.clean) {
			await this.doClean(outputDir);
			await this.doClean(join(outputDir, pkgRepo.version));
		}

		if (!this.repository && pkgRepo?.repository) {
			const repo = pkgRepo.repository;
			this.repository = typeof repo === 'string' ? repo : repo.url;
		}

		const json = build(this.tsconfig);
		const theme = await import('./render-html');
		renderJson(this, json).map(f => this.writeFile(f));

		if (this.summary) {
			const summary = await import('./render-summary');
			summary.render(this, json).map(f => this.writeFile(f));
		}

		try {
			await Promise.all(
				theme.render(this, json).map(f => this.writeFile(f))
			);
			await this.writeFile({
				name: 'styles.css',
				content: await fs.readFile(STYLES_CSS, 'utf8'),
			});
			await this.writeFile({
				name: 'runtime.bundle.min.js',
				content: await fs.readFile(RUNTIME_JS, 'utf8'),
			});
		} catch (e) {
			console.error(e);
			process.exitCode = 1;
		}
	}
}

const app = new DocGen();
app.start();
