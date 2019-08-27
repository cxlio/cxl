const header = () => `(cxl=>{"use strict";`,
	footer = () =>
		`})(exports?exports.cxl||(exports.cxl={}):window.cxl||(window.cxl={}))`,
	template = [
		'../template/src/core.js',
		'../rx/index.js',
		'../template/src/dom.js',
		'../template/src/template.js'
	],
	core = [
		header,
		'src/component.js',
		'src/css.js',
		'src/shady.js',
		'src/a11y.js',
		'src/drag.js'
	],
	ui = [
		'src/ui.js',
		'src/table.js',
		'src/forms.js',
		'src/time.js',
		c => `cxl.ui.version="${c.package.version}";})(this.cxl);`
	];

require('../build').build({
	outputDir: 'dist',
	targets: [
		{
			output: 'core.js',
			src: [
				...template,
				'src/component.js',
				'src/css.js',
				'src/shady.js',
				'src/a11y.js',
				'src/drag.js'
			]
		},
		{
			output: 'index.js',
			src: [...template, ...core, ...ui],
			minify: 'index.min.js'
		},

		{
			output: 'debug.js',
			src: [
				...template,
				'../template/src/debug.js',
				'../template/src/template-debug.js',
				...core,
				'src/ui-debug.js',
				...ui,
				'src/meta.js'
			]
		},
		{
			output: 'theme-legacy.js',
			src: ['src/theme-legacy.js'],
			minify: 'theme-legacy.min.js'
		},
		{
			output: 'validation.js',
			src: ['src/validation.js'],
			minify: 'validation.min.js'
		},
		{
			output: 'router.js',
			src: ['src/router.js'],
			minify: 'router.min.js'
		},
		{
			output: 'router.dbg.js',
			src: ['src/router.js', 'src/router-debug.js']
		},
		{
			output: 'LICENSE',
			src: ['../LICENSE']
		},
		{
			output: 'README.md',
			src: ['README.md']
		},
		{
			output: 'package.json',
			src: [
				c =>
					JSON.stringify({
						name: '@cxl/ui',
						version: c.package.version,
						license: c.package.license,
						files: ['*.js', 'LICENSE'],
						main: 'index.js',
						homepage: c.package.homepage,
						bugs: c.package.bugs,
						repository: c.package.repository
					})
			]
		}
	]
});
