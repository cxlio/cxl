const build = require('../build'),
	output = build.tsc('index.ts');

build.build({
	outputDir: '../dist/store',
	targets: [
		{
			output: 'index.js',
			src: [() => output['index.js']]
		},
		{
			output: 'index.d.ts',
			src: [() => output['index.d.ts']]
		}
	]
});
