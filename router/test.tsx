import { suite } from '../spec/index.js';
import { Router } from './index.js';
import { dom } from '../xdom/index.js';

export default suite('router', test => {
	const root = document.createElement('div');

	test('Router#go - no parameters', a => {
		const router = new Router(root);
		router.route({
			path: 'test',
			render: <div>Hello World</div>,
		});

		router.go('test');

		a.ok(router.instances.test);
		a.equal(router.currentRoute, router.routes.get('test'));
	});

	test('Router#go - parameters', a => {
		const router = new Router(root);
		router.route({
			id: 'test',
			path: 'test/:title',
			render: <div>Hello World</div>,
		});

		router.go('test/hello');

		a.equal(router.currentRoute, router.routes.get('test'));
		a.equal(router.instances.test.title, 'hello');
	});
});
