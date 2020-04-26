const { build, tsconfig, pkg } = require('../dist/build');

build({
	outputDir: '../dist/debug',
	tasks: [tsconfig(), pkg()],
});
