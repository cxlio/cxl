const build = require('../build'),
	output = build.tsc('index.ts'),
	SRC = ['src/core.js', '../rx/index.js', 'src/dom.js', 'src/template.js'];

build.build({
	outputDir: '../dist/template',
	targets: [
		{
			output: '../index.js',
			src: [() => output['index.js']]
		},
		{
			output: '../index.d.ts',
			src: [() => output['index.d.ts']]
		}
	]
});
