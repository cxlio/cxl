
require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'docs.js',
			src: [
				'node_modules/highlight.js/lib/highlight.js',
				() => `(function() { const module = { set export(fn) { fn(hljs); } };`,
				'node_modules/highlight.js/lib/languages/xml.js',
				'node_modules/highlight.js/lib/languages/javascript.js',
				() => `})();`,
				'src/docs.js'
			],
			minify: 'index.js'
		}
	]

});