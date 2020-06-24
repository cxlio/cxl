const { build, tsconfig, pkg, files } = require('../dist/build');

build({
	outputDir: '../dist/docgen',
	tasks: [tsconfig(), tsconfig('tsconfig.client.json')],
});
