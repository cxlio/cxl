const ts = require('typescript'),
	fs = require('fs'),
	cp = require('child_process'),
	AMD = fs.readFileSync('amd.js', 'utf8'),
	index = ts.transpileModule(fs.readFileSync('index.ts', 'utf8'), {
		compilerOptions: {
			strict: true,
			target: 'es6',
			moduleResolution: 'Node',
			removeComments: true,
			declaration: true,
			sourceMap: true,
			module: 'commonjs'
		}
	}),
	tsc = ts.transpileModule(fs.readFileSync('tsc.ts', 'utf8'), {
		compilerOptions: {
			strict: true,
			target: 'es6',
			moduleResolution: 'Node',
			removeComments: true,
			declaration: true,
			sourceMap: false,
			module: 'commonjs'
		}
	});

function write(path, source) {
	console.log(`Writing ${path}`);
	fs.writeFileSync(path, source);
}

cp.execSync('mkdir -p ../dist/build');
write('../dist/build/amd.js', AMD);
write('../dist/build/index.js', index.outputText);
write('../dist/build/module.js.map', index.sourceMapText);
write('../dist/build/tsc.js', tsc.outputText);
