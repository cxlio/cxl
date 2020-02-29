const { build, tsconfig, pkg, file } = require('../dist/build');

build({
	outputDir: '../dist/ui',
	tasks: [
		tsconfig(),
		tsconfig('tsconfig.test.json'),
		tsconfig('tsconfig.bundle.json'),
		file('test.html'),
		pkg()
	]
});
