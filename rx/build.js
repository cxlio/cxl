const {
	build,
	tsconfig,
	typescript,
	pkg,
	file,
	eslint,
	minify,
} = require('../dist/build/index.js');

build({
	outputDir: '../dist/rx',
	tasks: [tsconfig('tsconfig.test.json'), file('test.html', 'test.html')],
}).then(() => {
	build('package', {
		outputDir: '../dist/rx',
		tasks: [eslint(), file('../dist/rx/index.js').pipe(minify()), pkg()],
	});
});
