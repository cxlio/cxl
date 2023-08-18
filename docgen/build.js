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
			files(['hljs.css']).pipe(concatFile('styles.css')),
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
