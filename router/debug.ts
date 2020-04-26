import { Router } from './index.js';
import { override, log } from '../debug/index.js';

override(
	Router.prototype,
	'go',
	path => {
		log(`[router] Navigating to "${path}"`);
	},
	function (_void, path) {
		const route = this.currentRoute;
		if (route === this.routes.defaultRoute && !route?.path?.test(path))
			log(
				`[router] Path "${path}" not found. Falling back to default route`,
				this.routes
			);
	}
);
