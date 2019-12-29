const { build, tsconfig, pkg, amd, bundle } = require('../dist/build');

build({
	outputDir: '../dist/ui',
	tasks: [
		tsconfig(),
		tsconfig('tsconfig.bundle.json'),
		//		tsconfig('tsconfig.bundle.json').pipe(bundle('index.bundle.js')),
		pkg()
	]
});
