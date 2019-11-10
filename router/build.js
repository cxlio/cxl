const ts = require('typescript'),
	build = require('../build'),
	HEADER = () => `(exports=>{`,
	FOOTER = () => `})(typeof exports==='undefined' ?
		(this.cxl || (this.cxl={})).router = {} :
		exports);`;

build.build({
	outputDir: '../dist/router',
	targets: [
		/*{
			output: 'router.js',
			src: [HEADER, () => output['index.js'], FOOTER],
			minify: 'router.min.js'
		},*/
		...build.targets.typescript(),
		...build.targets.typescript({
			input: 'test.tsx',
			output: 'test.js',
			compilerOptions: {
				declaration: false,
				moduleResolution: 'node',
				module: 'CommonJS'
			}
		}),
		...build.targets.package()
	]
});
