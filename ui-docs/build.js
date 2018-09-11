
require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'ui-docs.js',
			src: [
				'../ui/dist/cxl-ui.js',
				'../ui/dist/cxl-ui-icons.js',
				'../ui/dist/cxl-ui-beta.js',
				'../router/dist/cxl-router.js',
				'../ui/src/meta.js',
				'../docs/src/docs.js',
				'src/docs.js',
			],
			minify: 'ui-docs.min.js'
		},
		{
			output: 'ui-docs-react.js',
			src: [
				'../ui/dist/cxl-ui.js',
				'../ui/dist/cxl-ui-icons.js',
				'../ui/dist/cxl-ui-beta.js',
				'../router/dist/cxl-router.js',
				'../ui/dist/cxl-ui-react.js'
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