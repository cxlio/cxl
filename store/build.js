const build = require('../build');

build.build({
	outputDir: '../dist/store',
	targets: [...build.targets.typescript(), ...build.targets.package()]
});
