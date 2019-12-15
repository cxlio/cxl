const { build, typescript, pkg } = require('../dist/build');

build({
	outputDir: '../dist/dom',
	tasks: [
		typescript(),
		typescript({
			input: 'virtual.ts',
			output: 'virtual.js'
		}),
		typescript({
			input: 'test.tsx',
			output: 'test.js'
		}),
		pkg()
		/*typescript({
			output: 'LICENSE',
			src: ['../LICENSE']
		})*/
	]
});
