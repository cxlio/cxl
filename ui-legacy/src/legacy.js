(cxl => {
"use strict";

Object.assign(cxl, {

	ENTITIES_REGEX: /[&<]/g,
	ENTITIES_MAP: {
		'&': '&amp;',
		'<': '&lt;'
	},

	pull(ary, item)
	{
		const i = ary.indexOf(item);

		if (i===-1)
			throw "Invalid Item";

		ary.splice(i, 1);
	},

	escape(str)
	{
		return str && str.replace(cxl.ENTITIES_REGEX, e => cxl.ENTITIES_MAP[e]);
	},

	sortBy(A, key)
	{
		return A.sort((a,b) => a[key]>b[key] ? 1 : (a[key]<b[key] ? -1 : 0));
	},

	debounce(fn, delay)
	{
		var to;

		function Result() {
			var args = arguments, thisVal = this;

			if (to)
				clearTimeout(to);
			to = setTimeout(function() {
				Result.fn.apply(thisVal, args);
			}, delay);
		}
		Result.fn = fn;
		Result.cancel = function() {
			clearTimeout(to);
		};

		return Result;
	}
});

})(this.cxl);
