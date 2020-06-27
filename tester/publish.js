const { build, tsconfig, typescript, pkg, file } = require('../dist/build');

build({
	outputDir: '../dist/tester',
	tasks: [pkg()],
});
