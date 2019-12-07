const { build, typescript, pkg } = require('../dist/build');

build({
	outputDir: '../dist/component',
	tasks: [
		typescript(),
		typescript({
			input: 'test.tsx',
			output: 'test.js',
			compilerOptions: {
				declaration: false
			}
		}),
		pkg()
	]
});
