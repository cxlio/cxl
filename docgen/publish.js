const {
	bundle,
	build,
	tsconfig,
	pkg,
	concat,
	file,
	files,
	minify,
} = require('../dist/build');

build({
	outputDir: '../dist/docgen',
	tasks: [
		concat(
			tsconfig('tsconfig.runtime.json'),
			file('../dist/docgen/runtime.js').pipe(minify())
		),
		pkg(),
	],
});
