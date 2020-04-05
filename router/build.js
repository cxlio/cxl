const { tsconfig, pkg, build } = require('../dist/build');

build({
	outputDir: '../dist/router',
	tasks: [tsconfig(), tsconfig('tsconfig.test.json'), pkg()]
});
