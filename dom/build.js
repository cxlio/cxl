const build = require('../build'),
	src = build.tsc('index.ts');

build.build({
	outputDir: '../dist/dom',
	targets: [
		{
			output: 'index.js',
			src: [() => src['index.js']]
		},
		{
			output: 'dom.js',
			src: [
				() => `(exports=>{`,
				() => src['index.js'],
				() => `})(this.cxl||(this.cxl={}));`
			],
			minify: 'dom.min.js'
		},
		{
			output: 'index.d.ts',
			src: [() => src['index.d.ts']]
		},
		{
			output: 'package.json',
			src: [build.package()]
		},
		{
			output: 'LICENSE',
			src: ['../LICENSE']
		}
	]
});
