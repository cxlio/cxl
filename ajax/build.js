const build = require('../build');

build.build({
	outputDir: '../dist/ajax',
	targets: [...build.targets.typescript()]
});
