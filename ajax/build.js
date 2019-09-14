const build = require('../build');

build.build({
	outputDir: '.',
	targets: [
		{
			output: 'index.js',
			src: [
				() => `(exports=>{`,
				() =>
					build.tsc('index.ts', {
						compilerOptions: {
							strict: true,
							target: 'es6',
							removeComments: true,
							declaration: true,
							incremental: true,
							module: 'commonjs'
						}
					}),
				() => `})(this.cxl||(this.cxl={}));`
			]
		}
	]
});
