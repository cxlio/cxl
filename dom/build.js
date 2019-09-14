const build = require('../build'),
	src = build.tsc('index.ts');

build.build({
	outputDir: '.',
	targets: [
		{
			output: 'index.js',
			src: [
				() => `(exports=>{`,
				() => src['out.js'],
				() => `})(this.cxl||(this.cxl={}));`
			]
		},
		{
			output: 'index.d.ts',
			src: [() => src['out.d.ts']]
		}
	]
});
