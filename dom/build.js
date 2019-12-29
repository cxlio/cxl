const { build, tsconfig, pkg } = require('../dist/build');

build({
	outputDir: '../dist/dom',
	tasks: [tsconfig(), tsconfig('tsconfig.test.json'), pkg()]
});
