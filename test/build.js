const { tsconfig, build, file, pkg } = require('../dist/build');

build({
	outputDir: '../dist/test',
	tasks: [tsconfig(), file('index.html'), pkg()]
});
