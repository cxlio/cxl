const { build, concat, file, bundle, umd, pkg } = require('../dist/build'),
	header = `(function(){"use strict";`,
	//footer = `})(exports?exports.cxl||(exports.cxl={}):window.cxl||(window.cxl={}))`,
	package = require('./package.json'),
	footer = `cxl.ui.version="${package.version}";}).apply(this);`,
	template = concat(
		file('../template/src/core.js'),
		file('../dist/rx/index.js').pipe(umd('cxl.rx={}')),
		file(['../template/src/dom.js', '../template/src/template.js'])
	),
	core = [
		'src/component.js',
		'src/css.js',
		'src/shady.js',
		'src/a11y.js',
		'src/drag.js'
	],
	ui = ['src/ui.js', 'src/table.js', 'src/forms.js', 'src/time.js'];

require('../dist/build').build({
	outputDir: 'dist',
	tasks: [
		concat(template, file([...core, ...ui])).pipe(
			bundle('index.js', {
				header: header,
				footer: footer
			})
		),
		/*concat(
			template,
			file([
				'../template/src/debug.js',
				'../template/src/template-debug.js',
				...core,
				'src/ui-debug.js',
				...ui,
				'src/meta.js'
			])
		).pipe(bundle('debug.js')),*/
		pkg()
		/*
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
		}*/
	]
});
