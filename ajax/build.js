const { build, typescript, pkg } = require('../dist/build');

build({
	outputDir: '../dist/ajax',
	tasks: [
		typescript({
			compilerOptions: {
				declaration: true
			}
		}),
		pkg()
	]
});
