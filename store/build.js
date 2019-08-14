const build = require('./build');

build.build({
	outputDir: 'dist',
	targets: [
		{
			output: 'test.js',
			src: [build.AMD, build.exec('npm run build-test')]
		}
	]
});
