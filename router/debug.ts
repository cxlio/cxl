import { log, override } from '@cxl/debug';
import { Router, RouteManager, Route } from './index.js';

override(
	RouteManager.prototype,
	'register',
	function (this: RouteManager, route) {
		const path = route.path?.toString();
		const routes: Route<any>[] = (this as any).routes;
		if (path && routes.find(r => r.path?.path === path))
			throw new Error(`Path "${path}" already registered`);
	}
);

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
