(cxl => {

const
	start = performance.now(),
	console = window.console
;

window.addEventListener('DOMContentLoaded', ev => {
	const now = performance.now();
	console.log(`[cxl] Page loaded in ${now-start}ms`);
});

function Notify(msg)
{
var
	method = this
;
	if (arguments.length>1)
	{
		console.groupCollapsed(msg);
		cxl.each(arguments, function(v) { method(v); });
		console.groupEnd();
	} else
		this(msg);

	return cxl;
}

function dbg()
{
	return Notify.apply(console.log.bind(console), arguments);
}

function warn()
{
	return Notify.apply(console.warn.bind(console), arguments);
}

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

cxl.debug = {
	override: override,
	dbg: dbg,
	warn: warn
};

})(this.cxl);