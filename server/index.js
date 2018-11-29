/* jshint node:true */
"use strict";

const
	path = require('path'),
	fs = require('fs'),
	os = require('os'),

	express = require('express'),
	colors = require('colors/safe'),
	pathToRegexp = require('path-to-regexp'),

	protocols = {
		http: require('http'),
		https: require('https')
	},

	modules = []
;

class Route {

	constructor(options)
	{
		if (typeof(options)==='string')
			this.path = options;
		else
			Object.assign(this, options);
	}

	get path()
	{
		return this.__path;
	}

	set path(val)
	{
		this.__path = val;
		this.__keys = [];

		this.regex = pathToRegexp(val, this.__keys);
	}

	match(path)
	{
		var m = this.regex.exec(path);

		if (m)
		{
			this.params = {};
			this.__keys.forEach((k, i) => {
				this.params[k.name] = m[i+1];
			});

			return true;
		}
	}

}

class Logger
{
	constructor(prefix)
	{
		this.prefix = prefix;
	}

	error(msg)
	{
		console.error(colors.red(`${this.prefix} ${msg}`));
	}

	dbg()
	{
	}

	log(msg)
	{
		console.log(`${this.prefix} ${msg}`);
	}

	operation(msg, fn, scope)
	{
	var
		t = this.hrtime(),
		result = typeof(fn)==='function' ? fn.call(scope) : fn,
		done = () => this.log(`${msg} (${this.formatTime(t)})`)
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
}

class Server {

	constructor()
	{
		this.server = express();
		this.server.set('env', 'production');
	}

	__findAddress(a)
	{
	var
		ni = os.networkInterfaces(),
		me=this, i, dns=require('dns')
	;

		function log(ip, err, host)
		{
			me.log(`Listening to ${me.secure?'https':'http'}://${host}:${a.port} (${ip})`);
		}

		function resolve(address)
		{
			dns.lookupService(address.address, me.port, log.bind(me, address.address));
		}

		for (i in ni)
			ni[i].forEach(resolve, this);
	}

	onServerStart()
	{
	var
		a = this.__listener.address(),
		address = a.address
	;
		if (!this.port)
			this.port = a.port;

		if (address==='::')
			this.__findAddress(a);
		else
			this.log('Listening to ' + address + ':' + a.port);
	}

	onServerError(e)
	{
		if (e.code==='EACCES')
			this.error('Could not start server in ' +
				this.host + ':' + this.port +
				'. Make sure the host and port are not already in use.'
			);
		this.error(e);
	}

	createSecureServer(options)
	{
		if (options.pfx)
			options.pfx = fs.readFileSync(options.pfx);
		else
		{
			options.key = fs.readFileSync(options.key);
			options.cert = fs.readFileSync(options.cert);
		}

		return protocols.https.createServer(options, this.server);
	}

	// TODO add validation
	_loadRoute(def)
	{
		var args = cxl.result(def, 'args');

		this.server[def.fn].apply(this.server, args);
	}

	_safeRoute(fn, req, res)
	{
		try {
			fn.call(this, req, res);
		} catch(e)
		{
			this.error(e);
			res.sendStatus(500);
		}
	}

	static(a, b)
	{
		if (typeof(a)==='string')
			a = path.normalize(a);

		return express.static.call(this, a, b);
	}

	/**
	 * Add new route. Order matters.
	 *
	 * @param {string|function} fn Function to execute or method name. It will
	 *                             be executed in the module's context.
	 */
	route(method, path, fn)
	{
		if (typeof(fn)==='string')
			fn = this[fn];

		this.__routes.push({
			id: `route ${method} ${path}`,
			fn: method.toLowerCase(),
			args: [ path, this._safeRoute.bind(this, fn) ]
		});

		return this;
	}

	start()
	{
	var
		l = this.__listener = this.secure ?
			this.createSecureServer(this.secure) :
			protocols.http.createServer(this.server)
	;
		l.listen(this.port, this.host, this.onServerStart.bind(this));

		this.server.started = true;

		process.on('close', l.close.bind(l));
		l.on('error', this.onServerError.bind(this));
	}

}

class Module extends Logger {

	static create(name)
	{
		return new this(name);
	}

	constructor(name)
	{
		super();

		this.name = name;
		this.logColor = this.logColor || 'green';
		this.port = 80;
		this.host = '';
		this.resources = [];
		this.prefix = colors[this.logColor](name);
	}

	/**
	 * Initialize module
	 */
	start()
	{
	}

}

class CXL extends Module
{
	/**
	 * Enable debug module
	 */
	enableDebug()
	{
		this.debug = true;
		require('./debug');
	}

	module(name, Def)
	{
		if (typeof(Def)!=='function')
			Def = this.extendClass(Module, Def);

		return (modules[name] = Def);
	}

	start()
	{
		process.title = this.name;

		for (var i in modules)
		{
			modules[i].create(i).start();
			this.dbg(`Module started ${i}`);
		}
	}
}

Object.assign(exports, {

	// TODO dont load automatically
	Logger: Logger,
	Module: Module,
	Route: Route,
	Server: Server,

	formatTime(time, time2)
	{
		if (time2===undefined)
			time2 = cxl.hrtime();

	var
		s = time2-time,
		str = s.toFixed(4) + 's'
	;

		// Color code based on time,
		return s > 0.1 ? (s > 0.5 ? colors.red(str) : colors.yellow(str)) : str;
	}

});