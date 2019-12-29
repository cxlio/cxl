const { tsconfig, pkg, build } = require('../dist/build');

build({
	outputDir: '../dist/css',
	tasks: [tsconfig(), pkg()]
});
