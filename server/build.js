const build = require('../build');

build.build({
	outputDir: '../dist/server',
	targets: [...build.targets.typescript(), ...build.targets.package()]
});
