const build = require('../build');

build.build({
	outputDir: '../dist/tester',
	targets: [
		...build.targets.typescript(),
		...build.targets.typescript({
			input: 'runner.ts',
			output: 'runner.js',
			compilerOptions: {
				outFile: 'runner.js'
			}
		}),
		...build.targets.package()
	]
});
