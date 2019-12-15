const { build, typescript, pkg, amd } = require('../dist/build');

build({
	outputDir: '../dist/tester',
	tasks: [
		typescript(),
		typescript({
			input: 'runner.ts',
			output: 'runner.js',
			compilerOptions: {
				declaration: false,
				lib: ['es2015'],
				outFile: 'runner.js',
				module: 'amd'
			}
		}).pipe(amd()),
		pkg()
	]
});
