const ts = require('typescript'),
	build = require('../build'),
	HEADER = () => `(exports=>{`,
	FOOTER = () => `})(typeof exports==='undefined' ?
		(this.cxl || (this.cxl={})).rx = {} :
		exports);`,
	output = build.tsc('index.ts');

build.build({
	outputDir: '.',
	targets: [
		{
			output: 'index.js',
			src: [HEADER, () => output['out.js'], FOOTER]
		},
		{
			output: 'index.d.ts',
			src: [() => output['out.d.ts']]
		}
	]
});
