const { build, tsconfig, typescript, pkg, file } = require('../dist/build');

build({
	outputDir: '../dist/spec',
	tasks: [tsconfig(), pkg()]
});
