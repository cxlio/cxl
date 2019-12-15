const { typescript, build } = require('../dist/build');

build({
	baseDir: '.',
	outputDir: '.',
	tasks: [
		typescript({
			compilerOptions: {
				declaration: false,
				esModuleInterop: true,
				// lib: ['lib.es2015.d.ts'],
				outFile: 'index.js',
				module: 'amd'
			}
		})
	]
});
