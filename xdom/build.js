const { build, tsconfig, pkg } = require('../dist/build');

build({
	outputDir: '../dist/xdom',
	tasks: [tsconfig('tsconfig.test.json'), pkg()]
});