
const
	template = [
		'../template/src/core.js',
		'../rx/index.js',
		'../template/src/template.js'
	],
	ui = [
		'src/component.js',
		'src/css.js',
		'src/shady.js',
		'src/ui.js'
	]
;

require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'cxl-ui.js',
			src: [ ...template, ...ui ],
			minify: 'index.js'
		},
		{
			output: 'debug.js',
			src: [
				...template,
				'../template/src/debug.js',
				'../template/src/template-debug.js',
				...ui,
				'src/beta.js',
				'src/ui-debug.js',
				'src/meta.js'
			]
		},
		{
			output: 'cxl-ui-legacy.js',
			src: [
				'src/legacy.js'
			]
		},
		{
			output: 'cxl-ui-beta.js',
			src: [
				'src/beta.js'
			],
			minify: 'beta.js'
		},
		{
			output: 'cxl-ui-angular.js',
			src: [
				...template,
				...ui,
				'dist/cxl-ui-icons.js',
				'src/ui-angular.js'
			],
			minify: 'angular.js'
		},
		{
			output: 'cxl-ui-react.js',
			src: [ 'src/react.js' ],
			minify: 'react.js'
		},
		{
			output: 'cxl-ui-ajax.js',
			src: [ 'src/ajax.js' ]
		},
		{
			output: 'cxl-ui-debug.js',
			src: [ 'src/ui-debug.js' ]
		}
	]


});
