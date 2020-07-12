import { Application, mkdirp, readJson, sh } from '../server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Node, build } from '../dts';
import { render as renderJson } from './render-json';

const RUNTIME_JS = __dirname + '/runtime.bundle.min.js';
const STYLES_CSS = __dirname + '/styles.css';

export interface File {
	name: string;
	content: string;
	node?: Node;
}

export class DocGen extends Application {
	name = '@cxl/docgen';
	outputDir = './docs';
	repository?: string;
	clean = false;
	debug = false;
	modulePackage?: any;

	setup() {
		this.parameters.register(
			{ name: 'repository', type: 'string' },
			{ name: 'clean', help: 'Remove all files from output directory' },
			{ name: 'outputDir', shortcut: 'o', type: 'string' },
			{ name: 'debug' }
		);
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
		const pkgRepo = (this.modulePackage = await readJson('package.json'));
		await mkdirp(outputDir);
		await mkdirp(outputDir + '/' + pkgRepo.version);

		if (this.clean) {
			await this.doClean(outputDir);
			await this.doClean(join(outputDir, pkgRepo.version));
		}

		if (!this.repository && pkgRepo)
			this.repository =
				typeof pkgRepo === 'string' ? pkgRepo : pkgRepo.url;

		const json = build();
		const theme = await import('./render-html');
		renderJson(this, json).map(f => this.writeFile(f));
		await Promise.all(theme.render(this, json).map(f => this.writeFile(f)));
		await this.writeFile({
			name: 'styles.css',
			content: await fs.readFile(STYLES_CSS, 'utf8'),
		});
		await this.writeFile({
			name: 'runtime.bundle.min.js',
			content: await fs.readFile(RUNTIME_JS, 'utf8'),
		});
	}
}

const app = new DocGen();
app.start();
