const {
	build,
	tsconfig,
	typescript,
	pkg,
	file,
} = require('../dist/build/index.js');

build({
	outputDir: '../dist/rx',
	tasks: [
		tsconfig(),
		tsconfig('tsconfig.test.json'),
		file('test.html', 'test.html'),
	],
});
