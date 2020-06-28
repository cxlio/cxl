import { Application, mkdirp, readJson } from '../server';
import { promises as fs } from 'fs';
import { Node, build } from '../dts';
import { render as renderJson } from './render-json';

const RUNTIME_JS = __dirname + '/runtime.bundle.min.js';

export interface File {
	name: string;
	content: string;
	node?: Node;
}

export class DocGen extends Application {
	name = '@cxl/docgen';
	outputDir = './docs';
	repository?: string;
	debug = false;
	modulePackage?: any;

	setup() {
		this.parameters.register(
			{ name: 'repository', type: 'string' },
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

	async run() {
		const outputDir = this.outputDir;
		const pkgRepo = (this.modulePackage = await readJson('package.json'));
		await mkdirp(outputDir);
		await mkdirp(outputDir + '/' + pkgRepo.version);
		if (!this.repository && pkgRepo)
			this.repository =
				typeof pkgRepo === 'string' ? pkgRepo : pkgRepo.url;

		const json = build();
		const theme = await import('./render-html');
		renderJson(this, json).map(f => this.writeFile(f));
		await Promise.all(theme.render(this, json).map(f => this.writeFile(f)));
		await this.writeFile({
			name: 'runtime.bundle.min.js',
			content: await fs.readFile(RUNTIME_JS, 'utf8'),
		});
	}
}

const app = new DocGen();
app.start();
