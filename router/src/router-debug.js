(cxl => {
"use strict";

const
	debug = cxl.debug,
	override = debug.override,
	dbg = debug.dbg
;

//
// Router
//
override(cxl.router, 'start', function() {
	if (this.started)
		throw "Router already started.";
}, function() {
	var routes = cxl.router.routesList.map(function(r) {
		return r;
	});

	routes.unshift('[router] Router Started');

	dbg.apply(this, routes);
});

override(cxl.router, 'executeRoute', null, function(result, route, args) {
	var meta = route;
	dbg('[router] Executing route ' + (meta.id || meta.name) + ' (' + meta.path + ')', route, args);
});

})(this.cxl);