const { build, typescript, pkg } = require('../dist/build');

build({
	outputDir: '../dist/worker',
	tasks: [
		typescript(),
		typescript({
			input: 'test.ts',
			output: 'test.js',
			compilerOptions: {
				declaration: false
			}
		}),
		pkg()
	]
});
