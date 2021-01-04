const {
	buildCxl,
	build,
	tsconfig,
	pkg,
	file,
	minify,
	concat,
} = require('../dist/build');

buildCxl(
	{
		outputDir: '../dist/ui',
		tasks: [file('test.html', 'test.html')],
	},
	{
		target: 'package',
		outputDir: '../dist/ui',
		tasks: [
			concat(
				tsconfig('tsconfig.bundle.json'),
				file('../dist/ui/icons.js').pipe(minify()),
				file('../dist/ui/index.bundle.js').pipe(minify())
			),
		],
	}
);
