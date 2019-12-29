const { build, tsconfig, pkg } = require('../dist/build');

build({
	outputDir: '../dist/template',
	tasks: [tsconfig(), tsconfig('tsconfig.test.json'), pkg()]
});
