
require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'diff.js',
			src: [ 'src/diff.js' ],
			minify: 'index.js'
		},
		{
			output: 'diff.worker.js',
			src: [ 'src/diff.js', 'src/worker.js' ],
			minify: 'diff.worker.min.js'
		}
	]

});