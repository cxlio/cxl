const build = require('../build');

build.build({
	outputDir: '../dist/template',
	targets: [
		...build.targets.typescript(),
		...build.targets.typescript({
			input: 'test.tsx',
			output: 'test.js',
			compilerOptions: {
				declaration: false,
				moduleResolution: 'node',
				module: 'CommonJS'
			}
		}),
		...build.targets.package()
	]
});
