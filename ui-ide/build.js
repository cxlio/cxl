const {
	buildCxl,
	bundle,
	concat,
	minify,
	file,
	files,
	concatFile,
} = require('../dist/build');

buildCxl(
	{
		target: 'package',
		outputDir: '../dist/ui-ide',
		tasks: [
			files([
				'../node_modules/codemirror/lib/codemirror.js',
				'source.cm.js',
				'../node_modules/codemirror/addon/search/searchcursor.js',
				'../node_modules/codemirror/addon/fold/xml-fold.js',
				'../node_modules/codemirror/addon/edit/matchbrackets.js',
				'../node_modules/codemirror/addon/edit/matchtags.js',
				'../node_modules/codemirror/addon/edit/closetag.js',
				'../node_modules/codemirror/addon/edit/closebrackets.js',
				'../node_modules/codemirror/addon/comment/comment.js',
				'../node_modules/codemirror/addon/comment/continuecomment.js',
				'../node_modules/codemirror/addon/fold/foldcode.js',
				'../node_modules/codemirror/addon/fold/foldgutter.js',
				'../node_modules/codemirror/addon/fold/brace-fold.js',
				'../node_modules/codemirror/addon/selection/active-line.js',
				'../node_modules/codemirror/mode/meta.js',
			]).pipe(concatFile('codemirror.js')),
			files([
				'source.cm.js',
				'../node_modules/codemirror/addon/mode/overlay.js',
				'../node_modules/codemirror/mode/javascript/javascript.js',
				'../node_modules/codemirror/mode/xml/xml.js',
				'../node_modules/codemirror/mode/htmlmixed/htmlmixed.js',
				'../node_modules/codemirror/mode/css/css.js',
				'../node_modules/codemirror/addon/mode/simple.js',
			]).pipe(concatFile('codemirror.modes.js')),
		],
	},
	{
		target: 'package',
		outputDir: '../dist/ui-ide',
		tasks: [
			concat(
				/* Bundle with default addons only */
				bundle(
					{
						codemirror: '../dist/ui-ide/codemirror.js',
						'@cxl/ui-ide/source.js': '../dist/ui-ide/source.js',
					},
					'source.bundle.js'
				),
				/* Bundle with default modes */
				bundle(
					{
						codemirror: '../dist/ui-ide/codemirror.js',
						codemirrorModes: '../dist/ui-ide/codemirror.modes.js',
						'@cxl/ui-ide/source.js': '../dist/ui-ide/source.js',
					},
					'source.bundle.modes.js'
				),
				file('../dist/ui-ide/source.bundle.js').pipe(minify())
			),
		],
	}
);
