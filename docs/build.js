
require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'docs.js',
			src: [
				'node_modules/highlight.js/lib/highlight.js',
				() => `(()=>{window.module={ set exports(fn) { hljs.registerLanguage('xml', fn); } };`,
				'node_modules/highlight.js/lib/languages/xml.js',
				() => `})();`,
				() => `(()=>{window.module={ set exports(fn) { hljs.registerLanguage('css', fn); } };`,
				'node_modules/highlight.js/lib/languages/css.js',
				() => `})();`,
				() => `(()=>{window.module={ set exports(fn) { hljs.registerLanguage('javascript', fn); } };`,
				'node_modules/highlight.js/lib/languages/javascript.js',
				() => '})(); hljs.$STYLE=`',
				'node_modules/highlight.js/styles/atom-one-light.css',
				() => '`;',
				'src/docs.js'
			],
			minify: 'index.js'
		},
		{
			output: 'docs.css',
			src: [
				'node_modules/highlight.js/styles/github.css'
			]
		}
	]

});