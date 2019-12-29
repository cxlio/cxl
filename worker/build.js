const { build, tsconfig, pkg } = require('../dist/build');

build({
	outputDir: '../dist/worker',
	tasks: [tsconfig(), tsconfig('tsconfig.test.json'), pkg()]
});
