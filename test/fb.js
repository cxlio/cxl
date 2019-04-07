
QUnit.config.autostart = false;
QUnit.module('fb');

QUnit.test('Entity', function(a) {
const
	E = cxl.entity({
	})
;
	a.ok(E);
});

QUnit.test('Reference#constructor', function(a) {
var
	db = new cxl.fb.Reference()
;
	a.ok(db);
	a.equal(db.path, '/');

	db = new cxl.fb.Reference('fb/test');
	a.equal(db.path, '/fb/test');
});

QUnit.test('FireReference#collection - empty path', function(a) {
var
	ref = new cxl.fb.Reference(),
	done = a.async(),
	subs = ref.collection('fb').subscribe(function(val) {
		a.ok(val);
		this.unsubscribe();
		done();
	})
;
});

QUnit.test('FireReference#subscribe - all fields', function(a) {
var
	ref = cxl.fb('fb/test'),
	done = a.async(),
	subs = ref.subscribe(function(val) {
		a.ok(val);
		a.equal(val.module, 'fb');
		this.unsubscribe();
		done();
	})
;
});

QUnit.test('FireReference#subscribe - path', function(a) {
var
	ref = new cxl.fb.Reference('fb/test'),
	done = a.async(),
	subs = ref.reference('module').subscribe(function(val) {
		a.equal(val, 'fb');
		this.unsubscribe();
		done();
	})
;
});

QUnit.test('FireReference#toPromise', function(a) {
	const done = a.async();

	cxl.fb('fb/test').toPromise().then(val => {
		a.ok(val);
		a.equal(val.module, 'fb');
		done();
	});
});

QUnit.test('FireModel#constructor', function(a) {

	class TestModel extends cxl.fb.Model
	{
		constructor()
		{
			super('fb/test', ref => ({
				module: {},
				collection: ref.collection('collection'),
				variable: {}
			}));
		}
	}

const
	done = a.async(),
	model = new TestModel()
;
	a.ok(model);
	a.ok(model.module instanceof cxl.fb.Reference);
	a.ok(model.collection instanceof cxl.fb.Collection);
	done();
});

cxl.fb.start({
	apiKey: "AIzaSyAjD_mhMqwRcTRiJ8fYNJteERHdKJaPq-Y",
	authDomain: "cxl-test.firebaseapp.com",
	databaseURL: "https://cxl-test.firebaseio.com",
	storageBucket: "cxl-test.appspot.com",
	messagingSenderId: "621527952271",
	projectId: 'cxl-test'
});

QUnit.start();