const { build, minify, pkg, file, eslint } = require('../dist/build/index.js');

build({
	outputDir: '../dist/rx',
	tasks: [eslint(), file('../dist/rx/index.js').pipe(minify()), pkg()],
});
