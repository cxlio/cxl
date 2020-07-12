const { build, tsconfig, file, minify } = require('../dist/build');

build(
	{
		outputDir: '../dist/docgen',
		tasks: [
			tsconfig(),
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
