const { typescript, pkg, build } = require('../dist/build');

build({
	outputDir: '../dist/css',
	tasks: [typescript(), pkg()]
});
