const build = require('../build'),
	output = build.tsc('index.ts'),
	SRC = ['src/core.js', '../rx/index.js', 'src/dom.js', 'src/template.js'];
build.build({
	outputDir: 'dist',
	targets: [
		{
			output: 'cxl-template.js',
			src: SRC,
			minify: 'cxl-template.min.js'
		},
		{
			output: 'cxl-template.dbg.js',
			src: [...SRC, 'src/debug.js', 'src/template-debug.js']
		},
		{
			output: '../index.js',
			src: [() => output['out.js']]
		},
		{
			output: '../index.d.ts',
			src: [() => output['out.d.ts']]
		}
	]
});
