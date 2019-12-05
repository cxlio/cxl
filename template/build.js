const build = require('../dist/build');

build.build({
	outputDir: '../dist/template',
	tasks: [
		build.targets.typescript(),
		build.targets.typescript({
			input: 'test.tsx',
			output: 'test.js',
			compilerOptions: {
				declaration: false
			}
		}),
		build.targets.package()
	]
});
