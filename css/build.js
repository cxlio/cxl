const { typescript, pkg, build } = require('../dist/build');

build({
	outputDir: '../dist/css',
	targets: [typescript(), pkg()]
});
