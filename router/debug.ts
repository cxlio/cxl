import { log, override } from '../debug/index.js';
import { Router } from './index.js';

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
		log(`[router] Navigated to "${path}"`, this.instances);
	}
);
