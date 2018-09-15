/*jshint node:true */
const
	fs = require('fs'),
	colors = require('colors'),
	UglifyJS = require('uglify-es'),

	ARGV = process.argv.slice(2).reduce(
		(acc, cur) => { acc[cur]=true; return acc; }, {})
;

function hrtime()
{
	var time = process.hrtime();
	return time[0] + (time[1]/1e9);
}

function formatTime(time, time2)
{
	if (time2===undefined)
		time2 = hrtime();

var
	s = time2-time,
	str = s.toFixed(4) + 's'
;
	// Color code based on time,
	return s > 0.1 ? (s > 0.5 ? colors.red(str) : colors.yellow(str)) : str;
}

function readFile(filename, encoding)
{
	return new Promise(function(resolve, reject)
	{
		fs.readFile(filename, encoding, function(err, content)
		{
			if (err) return reject(err);
			resolve(content);
		});
	});
}

function read(filename, encoding)
{
	return Array.isArray(filename) ?
		Promise.all(filename.map(f => readFile(f, encoding))) :
		readFile(filename, encoding);
}

function write(filename, content)
{
	return new Promise(function(resolve, reject) {
		fs.writeFile(filename, content, err => {
			if (err) return reject(err);
			resolve();
		});
	});
}

function $stat(filename)
{
	return new Promise(function(resolve, reject) {
		fs.stat(filename, function(err, stat) {
			if (err) return reject(err);
			resolve(stat);
		});
	});
}

function kb(bytes)
{
	return (bytes/1000).toFixed(2);
}

function stat(file)
{
	return $stat(file).catch(() => ({size:0}));
}

class Operation
{
	constructor()
	{

	}
}

class Source
{

}

class Target
{
	constructor(config)
	{

	}
}

class Builder {

	static build(config)
	{
		var builder = new Builder();

		return builder.buildAll(config);
	}

	error(msg)
	{
		console.error(colors.red(`${this.prefix} ${msg}`));
	}

	log(msg)
	{
		console.log(`${this.prefix} ${msg}`);
	}

	operation(msg, fn, scope)
	{
	var
		t = hrtime(),
		result = typeof(fn)==='function' ? fn.call(scope) : fn,
		done = () => this.log(`${msg} (${formatTime(t)})`)
	;
		if (result && result.then)
			result = result.then(function(res) {
				done();
				return res;
			});
		else
			done();

		return result;
	}

	buildAll(config)
	{
		this.prefix = config.name || 'build';
		this.outputDir = config.outputDir || 'dist';
		this.config = config;
		this.reportOutput = { targets: {} };

		try { fs.mkdirSync(this.outputDir); } catch(e) {}

		Promise.all(config.targets.map(
			target => this.operation(`Building ${target.output}`, this.build(target))
		)).then(() => {
		});
	}

	report(old, config)
	{
		const output = this.reportOutput.targets;

		return this.stat(config).then(stats => {
			console.log(config.output + `: ${kb(old[0].size)}Kb -> ${kb(stats[0].size)}Kb`);
			output[config.output] = stats[0].size;

			if (ARGV.minify && config.minify)
			{
				console.log(config.minify + ': ' + kb(stats[1].size) + 'Kb (' +
					(stats[1].size/stats[0].size*100).toFixed(2) + '%)');
				output[config.minify] = stats[1].size;
			}
		});
	}

	minify(source, output)
	{
		return this.operation('Minifying', function() {
			var result = UglifyJS.minify(source, {
				sourceMap: false,
				toplevel: true,
				output: { ascii_only: true }
			});

			if (result.error)
			{
				console.error(`Error minifying "${output}"`);
				throw new Error(result.error);
			}

			return write(output, result.code);
		});
	}

	stat(config)
	{
		return Promise.all([
			stat(this.outputDir + '/' + config.output),
			stat(this.outputDir + '/' + config.minify)
		]);
	}

	readSource(src)
	{
		return read(src, 'utf8');
	}

	async build(target)
	{
	var
		oldStat = await this.stat(target),
		source = typeof(target.src)==='function' ? target.src() : (await this.readSource(target.src)).join("\n")
	;
		await write(this.outputDir + '/' + target.output, source);

		if (ARGV.minify && target.minify)
			await this.minify(source, this.outputDir + '/' + target.minify);

		this.report(oldStat, target);
	}

}

module.exports = Builder;