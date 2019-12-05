/*jshint node:true */
const fs = require('fs'),
	cp = require('child_process'),
	path = require('path'),
	colors = require('colors'),
	UglifyJS = require('uglify-es'),
	SCRIPTDIR = path.dirname(process.argv[1]),
	BASEDIR = cp
		.execSync(`npm prefix`, { cwd: SCRIPTDIR })
		.toString()
		.trim(),
	ARGV = process.argv.slice(2).reduce((acc, cur) => {
		acc[cur] = true;
		return acc;
	}, {}),
	CONFIG = {},
	AMD = fs.readFileSync(__dirname + '/amd.js', 'utf8');

let PACKAGE;
try {
	PACKAGE = require(BASEDIR + '/package.json');
} catch (e) {
	PACKAGE = {};
}

CONFIG.package = PACKAGE;

if (BASEDIR) {
	console.log(`Running in ${BASEDIR}`);
	process.chdir(BASEDIR);
}

function hrtime() {
	var time = process.hrtime();
	return time[0] + time[1] / 1e9;
}

function formatTime(time, time2) {
	if (time2 === undefined) time2 = hrtime();
	const s = time2 - time,
		str = s.toFixed(4) + 's';
	// Color code based on time,
	return s > 0.1 ? (s > 0.5 ? colors.red(str) : colors.yellow(str)) : str;
}

function readFile(filename, encoding) {
	return new Promise((resolve, reject) => {
		fs.readFile(filename, encoding, (err, content) => {
			if (err) return reject(err);
			resolve(content);
		});
	});
}

function read(filename, encoding) {
	return Array.isArray(filename)
		? Promise.all(filename.map(f => readFile(f, encoding)))
		: readFile(filename, encoding);
}

function write(filename, content) {
	return new Promise(function(resolve, reject) {
		fs.writeFile(filename, content, err => {
			if (err) return reject(err);
			resolve();
		});
	});
}

function $stat(filename) {
	return new Promise(function(resolve, reject) {
		fs.stat(filename, function(err, stat) {
			if (err) return reject(err);
			resolve(stat);
		});
	});
}

function kb(bytes) {
	return (bytes / 1000).toFixed(2);
}

function stat(file) {
	return $stat(file).catch(() => ({ size: 0 }));
}

function fatalError(msg) {
	console.error(colors.red(msg));
	process.exit(1);
}

class Operation {
	constructor(msg, fn) {
		this.start = () => {
			const t = hrtime(),
				result = typeof fn === 'function' ? fn() : fn,
				done = () => this.log(`${msg} (${formatTime(t)})`);
			if (result && result.then)
				return result.then(function(res) {
					done();
					return res;
				});
			else done();

			return result;
		};
	}

	error(msg) {
		console.error(colors.red(`${this.prefix} ${msg}`));
		process.exit(1);
	}

	log(msg) {
		console.log(`${this.prefix} ${msg}`);
	}
}

class Task {
	constructor(name, fn) {
		this.name = name;
		this.fn = fn;
	}
}

class Builder {
	static build(config) {
		var builder = new Builder();

		return builder.buildAll(config);
	}

	error(msg) {
		console.error(colors.red(`${this.prefix} ${msg}`));
		console.error(msg);
		process.exit(1);
	}

	log(msg) {
		console.log(`${this.prefix} ${msg}`);
	}

	operation(msg, fn, scope) {
		var t = hrtime(),
			result = typeof fn === 'function' ? fn.call(scope) : fn,
			done = () => this.log(`${msg} (${formatTime(t)})`);
		if (result && result.then)
			result = result.then(function(res) {
				done();
				return res;
			});
		else done();

		return result;
	}

	buildAll(config) {
		this.prefix = config.name || 'build';
		this.outputDir = config.outputDir || 'dist';
		this.config = config;
		this.reportOutput = { targets: {} };

		if (config.chdir) {
			this.log(`chdir ${config.chdir}`);
			process.chdir(config.chdir);
		}

		cp.execSync(`mkdir -p ${this.outputDir}`);

		Promise.all(
			config.targets.map(target =>
				this.operation(`Building ${target.output}`, this.build(target))
			)
		).then(
			() => {},
			err => this.error(err)
		);
	}

	report(old, config) {
		const output = this.reportOutput.targets;

		return this.stat(config).then(stats => {
			console.log(
				config.output +
					`: ${kb(old[0].size)}Kb -> ${kb(stats[0].size)}Kb`
			);
			output[config.output] = stats[0].size;

			if (ARGV.minify && config.minify) {
				console.log(
					config.minify +
						': ' +
						kb(stats[1].size) +
						'Kb (' +
						((stats[1].size / stats[0].size) * 100).toFixed(2) +
						'%)'
				);
				output[config.minify] = stats[1].size;
			}
		});
	}

	minify(source, output) {
		return this.operation('Minifying', () => {
			const result = UglifyJS.minify(source, {
				sourceMap: false,
				toplevel: true,
				output: { ascii_only: true }
			});

			if (result.error) throw new Error(result.error);

			return write(output, result.code);
		});
	}

	stat(config) {
		return Promise.all([
			stat(this.outputDir + '/' + config.output),
			stat(this.outputDir + '/' + config.minify)
		]);
	}

	processSource(source) {
		const type = typeof source;

		if (type === 'function') return source(CONFIG);

		return read(source, 'utf8');
	}

	async readSource(src) {
		if (!Array.isArray(src)) src = [src];

		return Promise.all(src.map(this.processSource));
	}

	async build(target) {
		const oldStat = await this.stat(target),
			source = (await this.readSource(target.src)).join('\n');
		if (target.module === 'amd') source = AMD + source;

		await write(this.outputDir + '/' + target.output, source);

		if (ARGV.minify && target.minify)
			await this.minify(source, this.outputDir + '/' + target.minify);

		this.report(oldStat, target);
	}
}

function readSync(file) {
	return fs.readFileSync(file, 'utf8');
}

function tscError(d, line, ch, msg) {
	if (typeof msg === 'string')
		console.error(`[${d.file ? d.file.fileName : ''}:${line}] ${msg}`);
	else {
		do {
			console.error(
				`[${d.file ? d.file.fileName : ''}:${line}] ${msg.messageText}`
			);
		} while ((msg = msg.next && msg.next[0]));
	}
}

const FILE_CACHE = {};

function tsc(inputFileName, options) {
	let ts;
	try {
		ts = require('typescript');
	} catch (e) {
		fatalError('Typescript not found');
	}

	if (!options)
		try {
			options = JSON.parse(readSync('tsconfig.json')).compilerOptions;
		} catch (e) {
			options = {};
		}

	const diagnostics = [];
	const defaultOptions = ts.getDefaultCompilerOptions();

	// mix in default options
	options = ts.fixupCompilerOptions(
		Object.assign(
			{},
			defaultOptions,
			{
				target: 'es2017',
				moduleResolution: 'node',
				module: 'commonjs',
				experimentalDecorators: true,
				jsx: 'react',
				jsxFactory: 'dom'
			},
			options
		),
		diagnostics
	);

	console.log(`Typescript ${ts.version}`);
	console.log(options);

	const input = readSync(inputFileName);
	const sourceFile = ts.createSourceFile(inputFileName, input);

	let output = {};

	const normalizedFileName = ts.normalizePath(inputFileName);
	// Create a compilerHost object to allow the compiler to read and write files
	const compilerHost = {
		getSourceFile(fileName) {
			console.log('SOURCE ' + fileName);
			return fileName === normalizedFileName
				? sourceFile
				: FILE_CACHE[fileName] ||
						(FILE_CACHE[fileName] = ts.createSourceFile(
							fileName,
							readSync(fileName)
						));
		},

		writeFile(name, text) {
			console.log(`WRITE ${name}`);
			output[name] = text;
		},
		getDefaultLibFileName: () => ts.getDefaultLibFilePath(options),
		useCaseSensitiveFileNames: () => true,
		getCanonicalFileName: fileName => fileName,
		getCurrentDirectory: () => process.cwd(),
		getNewLine: () => '\n',
		fileExists: fileName => (
			console.log(`EXISTS? ${fileName}`), fs.existsSync(fileName)
		),
		readFile: name => (console.log(`READ ${name}`), read(name))
	};
	const program = ts.createProgram([inputFileName], options, compilerHost);

	diagnostics.push(
		...program.getSyntacticDiagnostics(sourceFile),
		...program.getSemanticDiagnostics(sourceFile),
		...program.getOptionsDiagnostics()
	);
	if (diagnostics.length) {
		diagnostics.forEach(d => {
			if (d.file) {
				const { line, character } = ts.getLineAndCharacterOfPosition(
					d.file,
					d.start
				);
				tscError(d, line, character, d.messageText);
			} else console.error(`${d.messageText}`);
		});
		fatalError('Typescript compilation failed');
	}
	// Emit
	program.emit();

	return output;
}

class Packager {
	constructor(source) {
		this.source = source;
	}

	package() {
		const moduleMap = {
				require: true,
				exports: true
			},
			dependencies = [];

		function define(name, deps) {
			moduleMap[name] = true;
			dependencies.push(...deps);
		}

		function getDependency(dep) {
			return moduleMap[dep] ? [] : read(require.resolve(dep));
		}

		const src = this.source;
		const outFn = new Function('define', src);
		outFn(define);
		return Promise.all(dependencies.flatMap(getDependency)).then(
			dep => dep.join('\n') + src
		);
	}
}

Object.assign(Builder, {
	AMD: () => AMD,
	exec: cmd => cp.execSync(cmd),

	read: read,
	stat: $stat,
	write: write,
	readSync: readSync,
	tsc: tsc,

	package(pkg) {
		return c =>
			JSON.stringify(
				Object.assign(
					{
						name: c.package.name,
						version: c.package.version,
						license: c.package.license,
						files: ['*.js', 'index.d.ts', 'LICENSE'],
						main: 'index.js',
						homepage: c.package.homepage,
						bugs: c.package.bugs,
						repository: c.package.repository,
						dependencies: c.package.dependencies,
						peerDependencies: c.package.peerDependencies
					},
					pkg
				)
			);
	},

	targets: {
		typescript(options) {
			options = {
				input: 'index.ts',
				output: 'index.js',
				declaration: 'index.d.ts',
				amd: false,
				compilerOptions: null,
				...options
			};

			const output = tsc(options.input, options.compilerOptions);
			const result = [
				{
					output: options.output,
					src: [
						() => (options.amd ? AMD : '') + output[options.output]
					]
				}
			];

			if (output[options.declaration])
				result.push({
					output: options.declaration,
					src: [() => output[options.declaration]]
				});

			if (output['.tsbuildinfo'])
				result.push({
					output: '.tsbuildinfo',
					src: [() => output['.tsbuildinfo']]
				});

			return result;
		},

		package(pkg) {
			return [
				{
					output: 'package.json',
					src: [Builder.package(pkg)]
				}
			];
		},

		test(inputFile, outputFile) {
			const output = tsc(inputFile || 'test.ts');
			outputFile = outputFile || 'test.js';
			return [
				{
					output: outputFile,
					src: [() => output[outputFile]]
				}
			];
		}
	},

	copy(src, dest) {
		if (Array.isArray(src))
			return Promise.all(src.map(s => this.copy(s, dest)));

		return new Promise((resolve, reject) => {
			fs.copyFile(src, dest, err => (err ? reject(err) : resolve()));
		});
	},

	list(path) {
		return new Promise((resolve, reject) => {
			fs.readdir(path, (err, files) =>
				err ? reject(err) : resolve(files)
			);
		});
	}
});

module.exports = Builder;
