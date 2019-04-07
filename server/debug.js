
function override(obj, fn, pre, post)
{
	if (!obj)
		throw new Error(`Could not override method "${fn}"`);

	const old = obj && obj[fn];

	if (!old)
		warn(`Overriding non existent method "${fn}"`);

	const
		newFn = obj[fn] = function()
		{
			if (pre)
				pre.apply(this, arguments);

			var result = old && old.apply(this, arguments);

			if (post)
			{
				var args = Array.prototype.slice.call(arguments);
				args.unshift(result);

				post.apply(this, args);
			}

			return result;
		}
	;

	newFn.$$old = old;
}

module.exports = cxl => {

	cxl.Logger.prototype.dbg = function(msg)
	{
		return this(msg);
	};

	override(cxl.Application.prototype, 'start', function() {
		this.log.dbg(`v${this.version} Starting application`);
	});

	override(cxl.Route.prototype, 'load', function() {
		debug(`Loading route ${this.method.toUpperCase()} ${this.path}`);
	});

	override(cxl.Server.prototype, 'start', null, function() {
		debug(`Listening to ${this.host}:${this.port}`);
	});

	override(cxl.Server.prototype, 'cors', function(hosts) {
		debug(`CORS enabled for host ${hosts}`);
	});

	override(cxl.Server.prototype, '$createServer', null, function(server) {
		server.use((req, res, next) => {
			debug(`${req.method} ${req.path}`);
			next();
		});
	});

	override(cxl.Route.prototype, 'request', null, function(promise, req, res) {
		function error(e)
		{
			debug.error(e);
			console.log(e);
		}

		promise.catch(error);
	});

	const debug = new cxl.Logger('debug');

	debug('Debug mode enabled');

	return debug;

};