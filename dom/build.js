const build = require('../build'),
	src = build.tsc('index.ts');

build.build({
	outputDir: '.',
	targets: [
		{
			output: 'index.js',
			src: [() => src['index.js']]
		},
		{
			output: 'dom.js',
			src: [
				() => `(exports=>{`,
				() => src['out.js'],
				() => `})(this.cxl||(this.cxl={}));`
			],
			minify: 'dom.min.js'
		},
		{
			output: 'index.d.ts',
			src: [() => src['index.d.ts']]
		}
	]
});
