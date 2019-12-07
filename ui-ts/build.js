const { build, typescript, pkg, amd } = require('../dist/build');

build({
	outputDir: '../dist/ui',
	tasks: [
		typescript({
			input: 'index.tsx',
			compilerOptions: {
				outFile: 'index.js',
				lib: [
					'lib.es2015.d.ts',
					'lib.dom.d.ts',
					'lib.dom.iterable.d.ts'
				],
				module: 'amd'
			}
		}).pipe(amd()),
		pkg()
	]
});
