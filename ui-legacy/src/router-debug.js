(cxl => {
"use strict";

const
	debug = cxl.debug,
	override = debug.override,
	console = window.console,
	executedRoutes = [],
	destroyedRoutes = []
;

override(cxl.router, 'executeRoute', null, function(result, route) {
	executedRoutes.push(route);
});

override(cxl.router, 'discardOldRoutes', function(newInstances) {
	const oldInstances = this.instances;

	for (let i in oldInstances)
		if (newInstances[i]!==oldInstances[i])
			destroyedRoutes.push(oldInstances[i]);
});

override(cxl.router, 'execute', null, (result, route, args) => {

	console.groupCollapsed(`[router] Executing Route "${route.id || route.name}" (${route.path})`);
	console.log('Parameters', args);
	console.log('Executed', executedRoutes.concat());
	console.log('Destroyed', destroyedRoutes.concat());
	console.groupEnd();

	executedRoutes.length = destroyedRoutes.length = 0;
});

})(this.cxl);