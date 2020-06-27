const { build, file, minify, pkg, eslint } = require('../dist/build');

build({
	outputDir: '../dist/dts',
	tasks: [eslint(), file('../dist/dts/index.js').pipe(minify()), pkg()],
});
