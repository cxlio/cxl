
require('../build').build({

	outputDir: 'dist',
	targets: [
		{
			output: 'diff.js',
			src: [
				() => `(root => {`,
				'src/diff.js',
				() => `
Object.assign(root, {
	diff: doDiff, patch: patch
});
})(typeof(module)!=='undefined' ? module.exports : (this.cxl || (this.cxl={})));
				`
			],
			minify: 'index.js'
		},
		{
			output: 'diff.worker.js',
			src: [ 'src/diff.js', 'src/worker.js' ],
			minify: 'diff.worker.min.js'
		}
	]

});