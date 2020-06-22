const { build, tsconfig, pkg, file, concat, minify } = require('../dist/build');

build({
	outputDir: '../dist/ui-ts',
	tasks: [
		concat(
			tsconfig('tsconfig.bundle.json'),
			file('../dist/ui-ts/index.bundle.js').pipe(minify())
		),
		pkg(),
	],
});
