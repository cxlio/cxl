import { dom } from '@cxl/tsx';
import { suite } from '@cxl/spec';
import { Router, normalize } from './index.js';

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
		a.equal((router.state?.root as any).title, 'hello');

		router.go('test/@title');
		a.equal(router.state?.route, router.routes.get('test'));
		a.equal((router.state?.root as any).title, '@title');
	});

	test('Router#go - empty path', a => {
		const router = new Router();
		router.route({
			path: 'test',
			render: () => <div>Hello World</div>,
		});
		router.route({
			path: '',
			render: () => <div>Hello World</div>,
		});

		router.go('test');
		a.equal(router.state?.route, router.routes.get('test'));
		router.go('');
		a.equal(router.state?.route, router.routes.get(''));
	});

	test('normalize', a => {
		a.equal(normalize('/'), '');
		a.equal(normalize('//'), '');
		a.equal(normalize('/path'), 'path');
		a.equal(normalize('/path/'), 'path');
	});

	test('Empty route', a => {
		const router = new Router();
		router.route({
			id: 'home',
			path: '/',
			render: () => <a />,
		});
		router.route({
			path: '/park',
			render: () => <a />,
		});

		router.go('');
		a.equal(router.state?.route.id, 'home');
		router.go('park');
		a.equal(router.state?.route.id, '/park');
		router.go('/');
		a.equal(router.state?.route.id, 'home');
		router.go('/park');
		a.equal(router.state?.route.id, '/park');
		router.go('/');
		router.go('/park/');
		a.equal(router.state?.route.id, '/park');
	});

	test('isActiveUrl()', a => {
		const router = new Router();
		router.route({
			id: 'home',
			path: '/',
			render: () => <a />,
		});
		router.route({
			id: 'park',
			parent: 'home',
			path: '/park',
			render: () => <b />,
		});

		router.route({
			parent: 'park',
			path: '/park/:item/details',
			render: () => <b />,
		});

		router.go('/park');
		a.ok(router.isActiveUrl('/'));
		a.ok(router.isActiveUrl('/park'));
		a.ok(router.isActiveUrl('/park/'));
		router.go('/park/item/details');
		a.ok(router.isActiveUrl('/'));
		a.ok(router.isActiveUrl('/park'));
		a.ok(router.isActiveUrl('/park/item/details'));
		a.ok(!router.isActiveUrl('/park/item2/details'));
	});
});
