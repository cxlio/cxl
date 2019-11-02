const ts = require('typescript'),
	fs = require('fs'),
	out = ts.transpileModule(fs.readFileSync('index.ts', 'utf8'), {
		compilerOptions: {
			strict: true,
			target: 'es6',
			moduleResolution: 'Node',
			removeComments: true,
			declaration: true,
			incremental: true,
			module: 'commonjs'
		}
	});

fs.writeFileSync('index2.js', out.outputText);
