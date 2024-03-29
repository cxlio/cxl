import { log, override } from '@cxl/debug';
import { Router, RouteElement, RouteManager, Route } from './index.js';

override(RouteManager.prototype, 'register', function (route) {
	const path = route.id;
	const routes: Route<RouteElement>[] = this.routes;
	if (path && routes.find(r => r.id === path))
		throw new Error(`Route with id "${path}" already registered`);
});

override(
	Router.prototype,
	'go',
	url => {
		const path = typeof url === 'string' ? url : url.path;
		log(`[router] Navigating to "${path}"`);
	},
	function (_void, url) {
		const route = this.state?.route;
		const path = typeof url === 'string' ? url : url.path;
		if (route === this.routes.defaultRoute && !route?.path?.test(path))
			log(
				`[router] Path "${path}" not found. Falling back to default route`,
				this.routes
			);
	}
);
