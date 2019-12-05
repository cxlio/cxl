const build = require('../build');

build.build({
	outputDir: '../dist/tester',
	targets: [
		...build.targets.typescript(),
		...build.targets.typescript({
			input: 'runner.ts',
			output: 'runner.js',
			amd: true,
			compilerOptions: {
				declaration: false,
				lib: ['lib.es2015.d.ts'],
				outFile: 'runner.js',
				module: 'amd'
			}
		}),
		...build.targets.package()
	]
});
