import { Application, mkdirp } from '../server';
import { promises } from 'fs';
import { Output as DtsOutput, Node, build, Kind } from '../dts';

type Theme = typeof import('./theme');

export class DocGen extends Application {
	name = '@cxl/docgen';
	outputDir = './docs';
	repository?: string;

	setup() {
		this.parameters.register({ name: 'repository', type: 'string' });
	}

	generateContainer(module: Node, theme: Theme) {
		const name = module.name.replace(/(\.tsx?)?$/, '.html');

		return () =>
			this.log(`Generating ${name} from ${module.name}`, () =>
				promises.writeFile(
					`${this.outputDir}/${name}`,
					theme.Page(this, module)
				)
			);
	}

	generateModules(json: DtsOutput, theme: Theme) {
		return Promise.all(
			json.modules.map(async m => {
				const renderModule = this.generateContainer(m, theme);

				if (!m.children) return;

				await Promise.all(
					m.children
						.filter(child => child.kind === Kind.Class)
						.map(child => this.generateContainer(child, theme))
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
		await this.generateModules(json, theme);
	}

	async run() {
		const outputDir = this.outputDir;
		const pkgRepo = this.package?.repository;
		await mkdirp(outputDir);
		if (!this.repository && pkgRepo)
			this.repository =
				typeof pkgRepo === 'string' ? pkgRepo : pkgRepo.url;

		const json = build();
		const theme = await import('./theme');
		// await this.generateJson(`${this.outputDir}/docs.json`, json);
		await this.generateDocs(json, theme);
	}
}

const app = new DocGen();
app.start();
