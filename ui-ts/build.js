const { build, tsconfig, pkg, file } = require('../dist/build');

build({
	outputDir: '../dist/ui-ts',
	tasks: [
		tsconfig(),
		tsconfig('tsconfig.test.json'),
		file('test.html', 'test.html'),
	],
});
