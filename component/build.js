const build = require('../dist/build');

build.build({
	outputDir: '../dist/component',
	tasks: [
		build.targets.typescript(),
		build.targets.typescript({
			input: 'test.tsx',
			output: 'test.js',
			compilerOptions: {
				declaration: false,
				lib: ['lib.es2015.d.ts', 'lib.dom.d.ts']
			}
		}),
		build.targets.package()
	]
});
