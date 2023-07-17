const {
	buildCxl,
	tsconfig,
	concat,
	file,
	minify,
	files,
	concatFile,
	tsBundle,
} = require('../dist/build');

buildCxl(
	{
		outputDir: '../dist/docgen',
		tasks: [
			file('highlight.js', 'highlight.js'),
			files([
				//'../node_modules/highlight.js/styles/default.css',
				//'../node_modules/highlight.js/styles/a11y-light.css',
				//'../node_modules/highlight.js/styles/androidstudio.css',
				'../node_modules/highlight.js/styles/atom-one-dark-reasonable.css',
			]).pipe(concatFile('styles.css')),
		],
	},
	{
		target: 'package',
		outputDir: '../dist/docgen',
		tasks: [
			concat(
				tsBundle('tsconfig.client.json', 'runtime.bundle.js', true),
				file('../dist/docgen/runtime.bundle.js').pipe(minify())
			),
		],
	}
);
