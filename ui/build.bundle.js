const { build, tsconfig, pkg, file } = require('../dist/build');

build({
	outputDir: '../dist/ui',
	tasks: [tsconfig('tsconfig.bundle.json')],
});
