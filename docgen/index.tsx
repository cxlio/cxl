import { Application, mkdirp } from '../server';
import { promises } from 'fs';
import { Output as DtsOutput, Node, build, Kind } from '../dts';

type Theme = typeof import('./theme');

let sourceUrl: string | { url: string };
let pkg: any;

export class DocGen extends Application {
	name = '@cxl/docgen';
	outputDir = './docs';
	repository?: string;

	generateContainer(json: DtsOutput, module: Node, theme: Theme) {
		const name = module.name.replace(/(\.tsx?)?$/, '.html');

		return () =>
			this.log(`Generating ${name} from ${module.name}`, () =>
				promises.writeFile(
					`${this.outputDir}/${name}`,
					theme.Page(pkg, json, module)
				)
			);
	}

	generateModules(json: DtsOutput, theme: Theme) {
		return Promise.all(
			json.modules.map(async m => {
				const renderModule = this.generateContainer(json, m, theme);

				if (!m.children) return;

				await Promise.all(
					m.children
						.filter(child => child.kind === Kind.Class)
						.map(child =>
							this.generateContainer(json, child, theme)
						)
						.map(render => render())
				);

				await renderModule();
			})
		);
	}

	async generateJson(outFile: string, json: DtsOutput) {
		await promises.writeFile(
			outFile,
			JSON.stringify(
				{
					modules: json.modules,
				},
				null,
				2
			)
		);
	}

	async generateDocs(json: DtsOutput, theme: Theme) {
		sourceUrl = this.repository || pkg.repository;
		this.log(`Using "${sourceUrl}" repository`);

		await this.generateModules(json, theme);
	}

	async run() {
		const outputDir = this.outputDir;
		await mkdirp(outputDir);
		const json = build();
		const theme = await import('./theme');
		pkg = JSON.parse(await promises.readFile('package.json', 'utf8'));
		await this.generateJson(`${this.outputDir}/docs.json`, json);
		await this.generateDocs(json, theme);
	}
}

const app = new DocGen();
app.start();
