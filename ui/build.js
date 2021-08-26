const {
	buildCxl,
	build,
	tsconfig,
	pkg,
	file,
	minify,
	concat,
} = require('../dist/build');

buildCxl({
	target: 'package',
	outputDir: '../dist/ui',
	tasks: [
		concat(
			tsconfig('tsconfig.bundle.json'),
			file('../dist/ui/index.bundle.js').pipe(minify())
		),
	],
});
