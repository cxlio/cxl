const { build, tsconfig, pkg, file } = require('../dist/build');

build({
	outputDir: '../dist/ui-ts',
	tasks: [tsconfig('tsconfig.bundle.json')]
});
