const build = require('../dist/build');

build.build({
	outputDir: '../dist/css',
	targets: [build.targets.typescript(), build.targets.package()]
});
