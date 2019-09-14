const build = require('../build'),
	output = build.tsc('index.ts');

build.build({
	outputDir: '.',
	targets: [
		{
			output: 'store.js',
			src: [() => output['out.js']]
		},
		{
			output: 'store.d.ts',
			src: [() => output['out.d.ts']]
		}
	]
});
