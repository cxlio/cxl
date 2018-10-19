
require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'docs.js',
			src: [
				'src/docs.js'
			],
			minify: 'index.js'
		}
	]

});