
require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'ui-docs.js',
			src: [
				'../ui/dist/index.js',
				'../ui/dist/icons.js',
				'../ui/dist/router.js',
				'../ui/dist/validation.js',
				'../ui/src/meta.js',
				'../docs/dist/docs.js',
				'src/docs.js',
			],
			minify: 'ui-docs.min.js'
		},
		{
			output: 'ui-docs-react.js',
			src: [
				'../ui/dist/index.js',
				'../ui/dist/icons.js',
				'../ui/dist/router.js',
				'../ui-react/index.js'
			],
			minify: 'ui-docs-react.min.js'
		},
		{
			output: 'index.html',
			src: [ 'src/index.html' ]
		},
		{
			output: 'react.html',
			src: [ 'src/react.html' ]
		}
	]

});
