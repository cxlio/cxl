(cxl => {
"use strict";

const
	debug = cxl.debug,
	override = debug.override,
	dbg = debug.dbg
;

override(cxl.router, 'executeRoute', null, function(result, route, args) {
	var meta = route;
	dbg('[router] Executing route ' + (meta.id || meta.name) + ' (' + meta.path + ')', route, args);
});

})(this.cxl);