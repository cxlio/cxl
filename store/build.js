const { build, typescript, pkg } = require('../dist/build');

build({
	outputDir: '../dist/store',
	tasks: [typescript(), pkg()]
});
