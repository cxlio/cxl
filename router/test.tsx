import { Router } from './index.js';
import { dom } from '../tsx/index.js';
import { suite } from '../spec/index.js';

export default suite('router', test => {
	test('Router#go - no parameters', a => {
		const router = new Router();
		router.route({
			path: 'test',
			render: () => <div>Hello World</div>,
		});

		router.go('test');

		a.ok(router.instances.test);
		a.equal(router.state?.route, router.routes.get('test'));
	});

	test('Router#go - parameters', a => {
		const router = new Router();
		router.route({
			id: 'test',
			path: 'test/:title',
			render: () => <div>Hello World</div>,
		});

		router.go('test/hello');

		a.equal(router.state?.route, router.routes.get('test'));
	});
});
