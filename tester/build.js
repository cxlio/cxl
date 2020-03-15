const { build, tsconfig, typescript, pkg, file } = require('../dist/build');

build({
	outputDir: '../dist/tester',
	tasks: [
		tsconfig('tsconfig.json'),
		tsconfig('tsconfig.browser.json'),
		pkg(),
		file('require.js'),
		file('require-browser.js')
	]
});
