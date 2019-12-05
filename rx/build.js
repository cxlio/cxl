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
		...build.targets.typescript({
			input: 'test.ts',
			output: 'test.js',
			compilerOptions: {
				lib: ['lib.es5.d.ts']
			}
		}),
		...build.targets.package()
	]
});
