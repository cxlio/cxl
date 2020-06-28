const { build, tsconfig, pkg } = require('../dist/build/index.js');

build({
	outputDir: '../dist/server',
	tasks: [tsconfig('tsconfig.test.json')],
}).then(() => {
	build('package', {
		outputDir: '../dist/server',
		tasks: [pkg()],
	});
});
