const { build, tsconfig, pkg } = require('../dist/build');

build({
	outputDir: '../dist/docgen',
	tasks: [tsconfig(), pkg()],
});
