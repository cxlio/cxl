
const
	header = () => `(cxl=>{"use strict";`,
	footer = () => `})(exports?exports.cxl||(exports.cxl={}):window.cxl||(window.cxl={}))`,

	template = [
		'../template/src/core.js',
		'../rx/index.js',
		'../template/src/template.js'
	],
	ui = [
		'src/component.js',
		'src/css.js',
		'src/shady.js',
		'src/ui.js',
		c => `cxl.version="${c.package.version}";`
	]
;

require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'cxl-ui.js',
			src: [
				...template,
				...ui
			],
			minify: 'index.js'
		},
		{
			output: 'debug.js',
			src: [
				...template,
				'../template/src/debug.js',
				'../template/src/template-debug.js',
				...ui,
				'src/ui-debug.js',
				'src/beta.js',
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
			output: 'cxl-ui-debug.js',
			src: [ 'src/ui-debug.js' ]
		},
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
