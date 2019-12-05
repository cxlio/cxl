const build = require('../build');

build.build({
	outputDir: '../dist/server',
	targets: [
		...build.targets.typescript({
			compilerOptions: {
				lib: ['lib.es2015.d.ts']
				//				types: ['../node_modules/@types/node']
			}
		}),
		...build.targets.typescript({
			input: 'colors.ts',
			output: 'colors.js',
			compilerOptions: {
				lib: ['lib.es2015.d.ts']
			}
		}),
		...build.targets.package()
	]
});
