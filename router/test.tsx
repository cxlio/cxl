import { suite } from '../tester';
import { router, route } from './index';

export = suite('router', test => {
	test('Router#execute', a => {
		let routeDef = route({
			path: 'test',
			routeElement: 'div'
		});

		router.setRoot(document.createElement('div'));
		router.execute(routeDef);

		a.ok(router.instances.test);
		a.equal(router.currentRoute, router.routes.get('test'));

		routeDef = route({
			id: 'test2',
			path: 'test/:id',
			routeElement: 'div'
		});

		router.execute(routeDef, { id: '10' });

		const current = router.currentRoute;

		a.ok(router.instances.test2);
		a.equal(current, router.routes.get('test2'));
		a.equal(router.current?.id, '10');
	});
});
