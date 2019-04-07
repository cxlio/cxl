/* jshint node:true */
"use strict";

const
	path = require('path'),
	fs = require('fs'),
	cp = require('child_process'),

	express = require('express'),
	colors = require('colors/safe'),

	protocols = {
		http: require('http'),
		https: require('https')
	}
;

class Route
{
	constructor(method, path, handle)
	{
		this.method = method;
		this.path = path;
		this.handle = handle;
	}

	load(server)
	{
		server.server[this.method](this.path, this.request.bind(server, this.handle));
	}

	request(handle, req, res)
	{
		function onError(e)
		{
			res.sendStatus(500);
			return Promise.reject(e);
		}

		try {
			const result = handle(req, res);

			return Promise.resolve(result).then(response => {
				if (response !== undefined)
					res.send(response);
			}, onError);

		} catch(e)
		{
			return onError(e);
		}
	}
}

function hrtime()
{
	return process.hrtime.bigint();
}

function operation(fn)
{
const
	t = hrtime(),
	result = typeof(fn)==='function' ? fn() : fn
;
	return Promise.resolve(result).then(res => ({
		start: t,
		end: hrtime() - t,
		result: res
	}));
}

function formatTime(time)
{
const
	s = time / 1000,
	str = s.toFixed(4) + 's'
;
	// Color code based on time,
	return s > 0.1 ? (s > 0.5 ? colors.red(str) : colors.yellow(str)) : str;
}

class Logger
{
	constructor(prefix, color = 'green')
	{
		const coloredPrefix = colors[color](prefix);

		function log(msg)
		{
			console.log(`${coloredPrefix} ${msg}`);
		}

		log.dbg = this.dbg;
		log.error = msg => console.error(colors.red(`${prefix} ${msg}`));
		log.operation = (msg, fn, scope) => {
			return operation(scope ? fn.bind(scope) : fn).then(result => {
				log(msg + ` ${formatTime(result.end)}`);
				return result.result;
			});
		};

		return log;
	}
}

class ServerOptions
{
	constructor(p)
	{
		this.port = p.port;
		this.host = p.host;
		this.cors = p.cors;

		if (p.secure)
			this.loadCertificates(p.secure);
	}

	loadCertificates(p)
	{
		if (p.pfx)
			p.pfx = fs.readFileSync(p.pfx);
		else
		{
			p.key = fs.readFileSync(p.key);
			p.cert = fs.readFileSync(p.cert);
		}

		this.secure = p;
	}


}

function parseBody(req)
{
	return new Promise((resolve, reject) => {
		const body = [];
		req.on('data', chunk => body.push(chunk));
		req.on('end', () => {
			try {
				const raw = Buffer.concat(body).toString();

				if (req.is('application/json'))
					resolve(JSON.parse(raw));
				else
					resolve(raw);
			} catch(e)
			{
				reject(e);
			}
		});
	});
}

class Server {

	constructor(p)
	{
		this.options = new ServerOptions(p);

		if (this.options.cors)
			this.cors(this.options.cors);
	}

	$createServer()
	{
		const server = express();
		server.set('env', 'production');

		// body parser
		server.use((req, res, next) => {
			parseBody(req).then(body => {
				req.body = body;
				next();
			});
		});

		return server;
	}

	get server()
	{
		return this.$server || (this.$server = this.$createServer());
	}

	get port()
	{
		return this.__listener.address().port;
	}

	get host()
	{
		return this.__listener.address().address;
	}

	onServerError(e)
	{
		if (e.code==='EACCES')
			throw new Error('Could not start server in ' +
				this.host + ':' + this.port +
				'. Make sure the host and port are not already in use.'
			);
		else
			throw new Error(e);
	}

	cors(hosts)
	{
		this.server.use((req, res, next) => {
			res.header('Access-Control-Allow-Origin', hosts || '*');
			res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
			if (req.method==='OPTIONS')
				res.end();
			else
				next();
		});

		return this;
	}

	use(middleware)
	{
		this.server.use(middleware);
		return this;
	}

	static(a, b)
	{
		if (typeof(a)==='string')
			a = path.normalize(a);

		return express.static.call(this, a, b);
	}

	/**
	 * Add new route. Order matters.
	 */
	route(method, path, fn)
	{
		const route = new Route(method.toLowerCase(), path, fn);
		route.load(this);
		return this;
	}

	start()
	{
	const
		p = this.options,
		l = this.__listener = p.secure ?
			protocols.https.createServer(p.secure, this.server) :
			protocols.http.createServer(this.server)
	;
		l.listen(p.port, p.host);

		l.on('error', this.onServerError.bind(this));
	}

}

class Application
{
	constructor(env)
	{
		this.$loadPackage();
		this.$loadEnvironment(env);
		this.log = new Logger(this.name);
	}

	$loadPackage()
	{
	const
		SCRIPTDIR = path.dirname(process.argv[1]),
		BASEDIR = cp.execSync(`npm prefix`, { cwd: SCRIPTDIR }).toString().trim(),
		pkg = this.package = require(BASEDIR + '/package.json')
	;
		this.name = pkg.name;
		this.version = pkg.version;
		this.plugins = [];
	}

	$loadEnvironment(environment)
	{
		environment = environment || require(process.cwd() + '/environment.json');
		this.environment = environment;

		if (environment.debug)
			exports.enableDebug();
	}

	start(fn)
	{
		fn.call(this, this.environment);

		return this;
	}
}

Object.assign(exports, global.cxl = {

	debug: false,

	Application: Application,
	Logger: Logger,
	Route: Route,
	Server: Server,

	serverModule()
	{
		return env => new Server(env.server);
	},

	application(env)
	{
		return new Application(env);
	},

	extend(A, B, C, D)
	{
		for (var i in B)
			if (B.hasOwnProperty(i))
				Object.defineProperty(A, i, Object.getOwnPropertyDescriptor(B, i));
		if (C || D)
			cxl.extend(A, C, D);

		return A;
	},

	/**
	 * Enable debug module
	 */
	enableDebug()
	{
		this.debug = require('./debug')(this);
	}

});