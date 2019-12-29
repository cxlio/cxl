const { build, tsconfig, pkg } = require('../dist/build/index.js');

build({
	outputDir: '../dist/server',
	tasks: [tsconfig(), pkg()]
});
