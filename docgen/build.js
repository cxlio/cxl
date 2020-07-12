const { buildCxl, tsconfig, file, minify } = require('../dist/build');

buildCxl(
	{
		outputDir: '../dist/docgen',
		tasks: [
			tsconfig('tsconfig.client.json'),
			file(
				'../node_modules/highlight.js/styles/default.css',
				'styles.css'
			),
		],
	},
	{
		target: 'package',
		outputDir: '../dist/docgen',
		tasks: [tsconfig('tsconfig.runtime.json')],
	},
	{
		target: 'package',
		outputDir: '../dist/docgen',
		tasks: [file('../dist/docgen/runtime.bundle.js').pipe(minify())],
	}
);
