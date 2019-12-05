const build = require('../dist/build');

build.build({
	outputDir: '../dist/ui',
	tasks: [
		build.targets.typescript({
			compilerOptions: {
				outFile: 'index.js',
				module: 'amd'
			}
		}),
		build.targets.package()
	]
});
