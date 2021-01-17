const {
	buildCxl,
	tsconfig,
	file,
	minify,
	files,
	concatFile,
} = require('../dist/build');

buildCxl(
	{
		outputDir: '../dist/docgen',
		tasks: [
			tsconfig('tsconfig.client.json'),
			files([
				'../node_modules/highlight.js/styles/default.css',
				'../node_modules/highlight.js/styles/a11y-light.css',
			]).pipe(concatFile('styles.css')),
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
