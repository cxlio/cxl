
const
	header = () => `(cxl=>{"use strict";`,
	footer = () => `})(exports?exports.cxl||(exports.cxl={}):window.cxl||(window.cxl={}))`,

	template = [
		'../template/src/core.js',
		'../rx/index.js',
		'../template/src/template.js'
	],

	ui = [
		header,
		'src/component.js',
		'src/css.js',
		'src/shady.js',
		'src/drag.js',
		'src/ui.js',
		'src/forms.js',
		'src/time.js',
		c => `cxl.ui.version="${c.package.version}";})(this.cxl);`
	]
;

require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'index.js',
			src: [
				...template,
				...ui
			],
			minify: 'index.min.js'
		},
		{
			output: 'debug.js',
			src: [
				...template,
				'../template/src/debug.js',
				'../template/src/template-debug.js',
				...ui,
				'src/ui-debug.js',
				'src/meta.js'
			]
		},
		{
			output: 'validation.js',
			src: [ 'src/validation.js' ],
			minify: 'validation.min.js'
		},
		{
			output: 'router.js',
			src: [ 'src/router.js' ],
			minify: 'router.min.js'
		},
		{
			output: 'router.dbg.js',
			src: [
				'src/router.js',
				'src/router-debug.js'
			]
		},
		{
			output: 'LICENSE',
			src: [ '../LICENSE' ]
		},
		{
			output: 'package.json',
			src: [
				c => JSON.stringify({
					name: "@cxl/ui",
					version: c.package.version,
					license: c.package.license,
					files: "*.js",
					main: "index.js",
					homepage: c.package.homepage,
					bugs: c.package.bugs,
					repository: c.package.repository
				})
			]
		}
	]


});
