const { build, tsconfig, pkg } = require('../dist/build');

build({
	outputDir: '../dist/component',
	tasks: [tsconfig(), tsconfig('tsconfig.test.json'), pkg()]
});
