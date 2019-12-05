const build = require('../build');

build.build({
	outputDir: '../dist/dom',
	targets: [
		...build.targets.typescript(),
		...build.targets.typescript({
			input: 'virtual.ts',
			output: 'virtual.js'
		}),
		...build.targets.typescript({
			input: 'test.tsx',
			output: 'test.js'
		}),
		...build.targets.package(),
		{
			output: 'LICENSE',
			src: ['../LICENSE']
		}
	]
});
