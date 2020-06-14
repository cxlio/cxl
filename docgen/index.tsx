import { Application, mkdirp } from '../server';
import { promises } from 'fs';
import { Node, build } from '../dts';
import { render as renderJson } from './render-json';

export interface File {
	name: string;
	content: string;
	node?: Node;
}

export class DocGen extends Application {
	name = '@cxl/docgen';
	outputDir = './docs';
	repository?: string;

	setup() {
		this.parameters.register({ name: 'repository', type: 'string' });
	}

	writeFile(file: File) {
		const name = file.name;
		return this.log(
			`Writing ${name}${file.node ? ` from ${file.node.name}` : ''}`,
			() => promises.writeFile(`${this.outputDir}/${name}`, file.content)
		);
	}

	async run() {
		const outputDir = this.outputDir;
		const pkgRepo = this.package?.repository;
		await mkdirp(outputDir);
		if (!this.repository && pkgRepo)
			this.repository =
				typeof pkgRepo === 'string' ? pkgRepo : pkgRepo.url;

		const json = build();
		const theme = await import('./render-html');
		renderJson(this, json).map(f => this.writeFile(f));
		await Promise.all(theme.render(this, json).map(f => this.writeFile(f)));
	}
}

const app = new DocGen();
app.start();
