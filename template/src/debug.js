(cxl => {

const
	console = window.console
;

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
	{
		warn('[debug] Could not override function: ' + fn);
		return;
	}

	const
		old = obj[fn],
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