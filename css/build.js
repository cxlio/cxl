const build = require('../build'),
	targets = build.targets;

build.build({
	outputDir: '../dist/css',
	targets: [...targets.typescript(), ...targets.package()]
});

/*const test = build.tsc('test.ts', {
	target: 'es6',
	removeComments: true,
	moduleResolution: 'node',
	module: 'amd',
	outFile: 'test.js'
});

build.build({
	outputDir: '../dist/test',
	targets: [
		{
			output: 'rx.js',
			src: [build.AMD, () => test['test.js']]
		}
	]
});
*/
