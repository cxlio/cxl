
const
	template = [
		'../template/src/core.js',
		'../template/src/rx.js',
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
			minify: 'cxl-ui.min.js'
		},
		{
			output: 'cxl-ui.dbg.js',
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
			output: 'cxl-ui-beta.js',
			src: [
				'src/beta.js'
			],
			minify: 'cxl-ui-beta.min.js'
		},
		{
			output: 'cxl-ui-angular.js',
			src: [
				...template,
				...ui,
				'dist/cxl-ui-icons.js',
				'src/ui-angular.js'
			]
		},
		{
			output: 'cxl-ui-react.js',
			src: [ 'src/react.js' ]
		}
	]

});
