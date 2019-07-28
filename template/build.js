const SRC = ['src/core.js', '../rx/index.js', 'src/dom.js', 'src/template.js'];
require('../build').build({
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
		}
	]
});
