
require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'cxl-router.js',
			src: [ 'src/router.js' ],
			minify: 'cxl-router.min.js'
		},
		{
			output: 'cxl-router.dbg.js',
			src: [
				'src/router.js',
				'src/router-debug.js'
			]
		}
	]

});
