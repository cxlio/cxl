
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
				'src/alpha.js',
				'src/meta.js'
			]
		},
		{
			output: 'alpha.dbg.js',
			src: [ 'src/alpha.js' ],
			minify: 'alpha.js'
		},
		{
			output: 'cxl-router.js',
			src: [ 'src/router.js' ],
			minify: 'router.js'
		},
		{
			output: 'router.dbg.js',
			src: [
				'src/router.js',
				'src/router-debug.js'
			]
		},
		{
			output: 'package.json',
			src: [
				c => JSON.stringify({
					name: "@cxl/ui",
					version: c.package.version,
					files: "*.js",
					main: c.package.main,
					homepage: c.package.homepage,
					bugs: c.package.bugs,
					repository: c.package.repository
				})
			]
		}
	]


});
