const { buildCxl, bundle, concat, minify, file } = require('../dist/build');

buildCxl({
	target: 'package',
	outputDir: '../dist/ui-ide',
	tasks: [
		concat(
			bundle(
				{
					codemirror: '../node_modules/codemirror/lib/codemirror.js',
					'@cxl/ui-ide/source.js': '../dist/ui-ide/source.js',
				},
				'source.bundle.js'
			),
			file('../dist/ui-ide/source.bundle.js').pipe(minify())
		),
	],
});
