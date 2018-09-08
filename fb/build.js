
require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'cxl-fb.js',
			src: [
				'node_modules/firebase/firebase-app.js',
				'node_modules/firebase/firebase-auth.js',
				'node_modules/firebase/firebase-database.js',
				'src/fb.js'
			],
			minify: 'cxl-fb.min.js'
		},
		{
			output: 'cxl-fb.dbg.js',
			src: [ 'src/fb.js', 'src/fb-debug.js' ]
		},
		{
			output: 'cxl-fb.lib.js',
			src: [
				'node_modules/firebase/firebase-app.js',
				'node_modules/firebase/firebase-auth.js',
				'node_modules/firebase/firebase-database.js'
			]
		}
	]
});