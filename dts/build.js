const { build, tsconfig, pkg } = require('../dist/build');

build({
	outputDir: '../dist/dts',
	tasks: [tsconfig(), tsconfig('tsconfig.test.json'), pkg()],
});
