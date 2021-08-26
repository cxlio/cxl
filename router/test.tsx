import { dom } from '@cxl/tsx';
import { suite } from '@cxl/spec';
import {
	Router,
	getElementRoute,
	normalize,
	parseQueryParameters,
	parseUrl,
	replaceParameters,
	QueryStrategy,
	PathStrategy,
	HashStrategy,
	sys,
} from './index.js';

export default suite('router', test => {
	sys.location = {
		pathname: '',
		hash: '',
		search: '',
	} as any;

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

	test('getElementRoute', a => {
		const router = new Router();
		const el = <div>Hello World</div>;
		router.route({
			path: 'test',
			render: () => el,
		});
		router.go('test');

		const route = getElementRoute(el);
		a.equal(route?.path?.toString(), 'test');
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

	test('Router#getPath', it => {
		it.should('replace parameters if present', a => {
			const router = new Router();
			router.route({
				id: 'test',
				path: '/park/:item/details',
				render: () => <b />,
			});

			const path = router.getPath('test', { item: a.id.toString() });
			a.equal(path, `park/${a.id}/details`);
		});
	});

	test('isActiveUrl()', it => {
		it.should('match parent routes', a => {
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
			a.ok(!router.isActiveUrl('/park/item'));
			a.ok(router.isActiveUrl('/park/item/details'));
			a.ok(!router.isActiveUrl('/park/item2/details'));

			router.go('/park/item2/details');
			a.ok(!router.isActiveUrl('/park/item/details'));
		});

		it.should('match parameters', a => {
			const router = new Router();

			router.route({
				id: 'park',
				path: '/park/:parkid',
				render: () => <b />,
			});

			router.go('/park/item2');
			a.ok(router.isActiveUrl('/park/item2'));
			a.ok(router.isActiveUrl('/park/item2/'));
			a.ok(!router.isActiveUrl('/park/item'));
		});
	});

	test('replaceParameters', it => {
		it.should('work with empty path', a => {
			const url = replaceParameters('', {
				world: a.id.toString(),
			});
			a.equal(url, '');
		});

		it.should('work with no parameters', a => {
			const url = replaceParameters('');
			a.equal(url, '');
		});

		it.should('replace parameters in a url', a => {
			const url = replaceParameters('/hello/:world', {
				world: a.id.toString(),
			});
			a.equal(url, `/hello/${a.id}`);
		});
	});

	test('parseQueryParameters', it => {
		it.should('parse query parameters in url', a => {
			const params = parseQueryParameters('test=hello&hello=world');
			a.equal(params.test, 'hello');
			a.equal(params.hello, 'world');
		});
	});

	test('QueryStrategy', it => {
		it.should('get href from url', a => {
			const url = { path: 'path', hash: 'hash' };
			const href = QueryStrategy.getHref(url);
			a.equal(href, '?path#hash');
		});
		it.should('update history state', a => {
			const url = { path: 'path', hash: 'hash' };
			let ran = false;
			const oldHistory = sys.history;

			sys.history = {
				pushState(state: any, _title: any, url: string) {
					a.equal(url, '?path#hash');
					(sys.history as any).state = state;
					if (ran) throw new Error('Should only run once');
					ran = true;
				},
			} as any;

			QueryStrategy.serialize(url);
			QueryStrategy.serialize(url);

			sys.history = oldHistory;
		});
		it.should('get state from history state if present', a => {
			const url = { path: 'path', hash: 'hash' };
			const oldHistory = sys.history;
			sys.history = { state: { url } } as any;
			const state = QueryStrategy.deserialize();
			a.equalValues(state, url);
			sys.history = oldHistory;
		});
		it.should('get state from location', a => {
			const url = { path: 'path', hash: 'hash' };
			const oldLocation = sys.location;
			sys.location = { search: '?path', hash: '#hash' } as any;
			const state = QueryStrategy.deserialize();
			a.equalValues(state, url);
			sys.location = oldLocation;
		});
	});
	test('PathStrategy', it => {
		it.should('get href from url', a => {
			const url = { path: 'path', hash: 'hash' };
			const href = PathStrategy.getHref(url);
			a.equal(href, 'path#hash');
		});
		it.should('update history state', a => {
			const url = { path: 'path', hash: 'hash' };
			let ran = false;
			const oldHistory = sys.history;

			sys.history = {
				pushState(state: any, _title: any, url: string) {
					a.equal(url, 'path#hash');
					(sys.history as any).state = state;
					if (ran) throw new Error('Should only run once');
					ran = true;
				},
			} as any;

			PathStrategy.serialize(url);
			PathStrategy.serialize(url);

			sys.history = oldHistory;
		});
		it.should('get state from history state if present', a => {
			const url = { path: 'path', hash: 'hash' };
			const oldHistory = sys.history;
			sys.history = { state: { url } } as any;
			const state = PathStrategy.deserialize();
			a.equalValues(state, url);
			sys.history = oldHistory;
		});
		it.should('get state from location', a => {
			const url = { path: 'path', hash: 'hash' };
			const oldLocation = sys.location;
			sys.location = { pathname: 'path', hash: '#hash' } as any;
			const state = PathStrategy.deserialize();
			a.equalValues(state, url);
			sys.location = oldLocation;
		});
	});
	test('HashStrategy', it => {
		it.should('get href from url', a => {
			const url = { path: 'path', hash: 'hash' };
			const href = HashStrategy.getHref(url);
			a.equal(href, '#path#hash');
		});
		it.should('update history state', a => {
			const url = { path: 'path', hash: 'hash' };
			HashStrategy.serialize(url);
			a.equal(sys.location.hash, '#path#hash');
		});
		it.should('get state from hash', a => {
			const url = { path: 'path', hash: 'hash' };
			HashStrategy.serialize(url);
			const state = HashStrategy.deserialize();
			a.equalValues(state, url);
		});
	});

	test('parseUrl', it => {
		it.should('handle hash only urls', a => {
			const url = parseUrl('#hash');
			a.equal(url.hash, 'hash');
		});
		it.should('handle path and hash', a => {
			const url = parseUrl('path#hash');
			a.equal(url.hash, 'hash');
			a.equal(url.path, 'path');
		});
	});
});
