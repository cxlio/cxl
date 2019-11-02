const ts = require('typescript'),
	build = require('../build'),
	HEADER = () => `(exports=>{`,
	FOOTER = () => `})(typeof exports==='undefined' ?
		(this.cxl || (this.cxl={})).rx = {} :
		exports);`,
	output = build.tsc('index.ts');

build.build({
	outputDir: '../dist/rx',
	targets: [
		{
			output: 'index.js',
			src: [HEADER, () => output['index.js'], FOOTER]
		},
		{
			output: 'index.d.ts',
			src: [() => output['index.d.ts']]
		},
		{
			output: 'package.json',
			src: [build.package()]
		}
	]
});

const test = build.tsc('test.ts', {
	target: 'es6',
	removeComments: true,
	moduleResolution: 'node',
	module: 'amd',
	outFile: 'test.js'
});

build.build({
	outputDir: '../dist/test',
	targets: [
		{
			output: 'rx.js',
			src: [build.AMD, () => test['test.js']]
		}
	]
});
