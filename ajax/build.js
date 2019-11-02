const build = require('../build');
const out = build.tsc('index.ts', {
	compilerOptions: {
		strict: true,
		target: 'es6',
		removeComments: true,
		declaration: true,
		incremental: true,
		module: 'commonjs'
	}
});

build.build({
	outputDir: '../dist/ajax',
	targets: [
		{
			output: 'index.js',
			src: [() => out['index.js']]
		},
		{
			output: 'index.d.ts',
			src: [() => out['index.d.ts']]
		},
		{
			output: 'ajax.js',
			src: [
				() => `(exports=>{`,
				() => out['index.js'],
				() => () => `})(this.cxl||(this.cxl={}));`
			],
			minify: 'ajax.min.js'
		}
	]
});
