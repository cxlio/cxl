const { buildCxl, tsconfig, typescript, pkg, file } = require('../dist/build');

buildCxl({
	outputDir: '../dist/tester',
	tasks: [
		tsconfig('tsconfig.browser.json'),
		file('require.js', 'require.js'),
		file('require-browser.js', 'require-browser.js'),
	],
});
