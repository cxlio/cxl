const { build, tsconfig, pkg, amd, bundle } = require('../dist/build');

build({
	outputDir: '../dist/ui',
	tasks: [
		tsconfig(),
		tsconfig('tsconfig.test.json'),
		tsconfig('tsconfig.bundle.json'),
		pkg()
	]
});
