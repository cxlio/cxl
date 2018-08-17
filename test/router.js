
QUnit.module('router');

QUnit.test('Route', function(a) {
var
	route = cxl.route({
		path: '*test'
	})
;
	a.ok(route);
});

QUnit.test('Router#execute', function(a) {
var
	route = cxl.route({
		path: 'test'
	}),
	current
;
	cxl.router.root = cxl.dom('div');
	cxl.router.execute(route);

	a.ok(cxl.router.instances.test);
	a.equal(cxl.router.currentRoute, cxl.router.routes.test);

	route = cxl.route({ id: 'test2', path: 'test/:id' });

	cxl.router.execute(route, { id: 10 });

	current = cxl.router.currentRoute;

	a.ok(cxl.router.instances.test2);
	a.equal(current, cxl.router.routes.test2);
	a.equal(cxl.router.current.id, 10);

});
