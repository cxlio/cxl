
/*jshint esnext:true */

cxl.debounce = function(cb) { return cb; };

const
	dom = cxl.dom
;

var
	nameId = 0
;

function $$fixture(A)
{
	const result = document.getElementById('qunit-fixture');

	if (A)
	{
		result.appendChild(A);

		if (cxl.shady)
			cxl.shady.upgrade(A, true);
	}

	return result;
}

function $$render(view)
{
	cxl.renderer.cancel();
	cxl.renderer.digest(view);
	cxl.renderer.commit();
}

function $$compile(html, view)
{
	const host = document.createElement('DIV');

	html = new cxl.Template(html);

	if (!(view instanceof cxl.View))
		view = new cxl.View(view, host);

	host.appendChild(html.compile(view));

	$$render(view);

	$$fixture(host);
	view.connect();

	$$render(view);

	return view;
}

function $$tagName()
{
	return 'test-' + nameId++;
}

QUnit.module('template');

QUnit.test('EventListener', function(a) {
var
	el = dom('div'),
	done = a.async(),
	listener = new cxl.EventListener(el, 'click', function(ev) {
		a.ok(ev);
		a.equal(ev.type, 'click');
		listener.destroy();
		done();
	})
;
	el.dispatchEvent(new Event('click'));
});

QUnit.test('Directive#next', function(a) {
var
	owner = { digest() { } },
	A = new cxl.Directive(null, null, owner),
	update = false
;
	A.next('Hello');
	a.ok(A.value, 'Hello');

	A.next('Hello');
	A.update = function() { update = true; };
	a.ok(A.value, 'Hello');
	a.equal(update, false);

	A.next('World');
	a.ok(update);
});

QUnit.test('cxl.Directive#update', function(a) {
var
	owner = { digest() { } },
	A = new cxl.Directive(null, null, owner),
	B = new cxl.Directive(null, null, owner),
	C = new cxl.Directive(null, null, owner),
	D = new cxl.Directive(null, null, owner),
	E = new cxl.Directive(null, null, owner),
	done = a.async()
;
	B.update = val => val.toUpperCase();
	A.update = function(val) {
		a.equal(this.value, cxl.Undefined);
		a.equal(val, 'hello');
	};

	C.update = function() {
		return Promise.resolve('Resolved');
	};

	D.update = function() { a.equal('Resolved', C.value); };
	E.update = function() { a.equal(B.value, 'WORLD'); };

	C.subscribe(D);
	B.subscribe(E);

	Promise.all([
		A.next('hello'), C.next('Promise'), B.next('world')
	]).then(done);
});

/*
QUnit.test('cxl.Observable#onError', function(a) {
var
	A = new cxl.Observable(),
	done = a.async()
;
	A.update = function() {
		return a.hello();
	};

	A.on('error', function(ref, val) {
		a.equal(ref, A);
		a.ok(val.message);
	});

	A.set('error').catch(function() {
		a.equal(A.value, cxl.Undefined);
	}).then(function() {
		A.update = function() {
			throw new Error("Hello");
		};
		return A.set('world');
	}).catch(done);
});

QUnit.test('cxl.Observable#onComplete', function(a) {
var
	A = new cxl.Observable(),
	val = 1,
	done = a.async()
;
	A.on('complete', function() {
		a.equal(A.value, val);
	});

	A.set(val).then(function() {
		return A.set((val = 2));
	}).then(function() {
		A.update = function() {
			return cxl.Promise.reject();
		};
		return A.set(3);
	}).catch(done);
});
*/

QUnit.test('Directive#subscribe', function(a) {
var
	owner = { digest() { } },
	A = new cxl.Directive(null, null, owner),
	B = new cxl.Directive(null, null, owner),
	val = 10
;
	B.update = function(v) { a.equal(v, val); };
	A.subscribe(B);
	A.next(10);
	a.equal(A.value, B.value);

	A.next(val=11);
	a.equal(A.value, 11);
	a.equal(B.value, 11);
	a.equal(A.value, B.value);
});

/*
QUnit.test('cxl.Observable#once', function(a) {
var
	A = new cxl.DirectiveObservable(),
	done = a.async(),
	val = 1
;
	A.complete', function(val) {
		a.ok(val, this.value);
	});

	A.set(val).then(function() {
		return A.set(2);
	}).then(done);
});


QUnit.test('cxl.Observable#trigger', function(a) {
var
	A = new cxl.Observable(),
	val = 0,
	ev1, ev2
;
	ev1 = A.on('custom', function(a) { val+=a; });
	ev2 = A.on('custom', function(a) { val+=a; });
	A.on('custom', function(a) { val+=a; });

	A.trigger('custom', 3);
	a.equal(val, 9);
	ev2.unbind();

	A.trigger('custom', 5);
	a.equal(val, 19);

	ev1.unbind();
	A.trigger('custom', 8);
	a.equal(val, 27);

	A.on('params', function() {
		a.equal(arguments.length, 3);
	});

	A.trigger('params', 1, 2, 3);
});
*/

QUnit.test('compile()', function(a) {
var
	view = $$compile('<div &="=style:@styleText =title:@title"></div>', {
		title: 'Title',
		style: 'color:Blue'
	})
;
	a.ok(view);
});

QUnit.test('more than one bindings', function(a) {
var
	state = { title: 'Title', style: 'color:blue' },
	owner = $$compile('<test &="id(el) =style:@styleText =title:@title">', state),
	el = owner.state.el
;
	a.equal(owner.bindings.length, 3);
	a.equal(el.styleText, state.style);
	a.equal(el.title, state.title);

	state.style = 'color:red';
	state.title = 'Untitled';

	$$render(owner);

	a.equal(el.styleText, state.style);
	a.equal(el.title, state.title);
});

QUnit.test('two way binding', function(a) {
var
	state = { value: 10 },
	view = $$compile('<cxl-test &="=value::=copy"></cxl-test>', state)
;
	$$render(view);
	a.equal(view.bindings.length, 2);
	a.equal(state.copy, 10);

	state.copy = 100;
	$$render(view);

	a.equal(state.value, 100);
});

QUnit.test('input two way binding', function(a) {
var
	comp = $$compile('<input &="id(input) value::=copy" />', { copy: 'world' })
;
	$$render(comp);
	a.equal(comp.state.input.value, 'world');
});

QUnit.test('directive()', function(a) {

	cxl.directive(a.test.testId, { initialize(el) {
		el.innerHTML = 'Hello';
	}});

	var A = $$compile('<div &="id(input) ' + a.test.testId + '"></div>');

	a.ok(A);
	a.equal(A.state.input.innerHTML, 'Hello');
});

QUnit.test('attribute - set', function(a) {
var
	state = { expr: 10 },
	A = $$compile('<div &="id(div) =expr:attribute(test)"></div>', state),
	div = state.div
;
	a.equal(div.getAttribute('test'), 10);

	A = $$compile('<div &="id(div) =val:attribute(test)"></div');
	div = A.state.div;

	a.ok(!div.getAttribute('test'));

	A.state.val = 123;
	$$render(A);
	a.equal(div.getAttribute('test'), 123);
});

/*QUnit.test('content - component slots', function(a) {

var
	A = $$compile('<cxl-header-nav>' +
		'Ignored content' +
		'<cxl-nav-item>Hello</cxl-nav-item>' +
		'<cxl-nav-item href="hello" &="=test:show"></cxl-nav-item>' +
		'<cxl-nav-item>Hello 2</cxl-nav-item>' +
		'</cxl-header-nav>', { test: true }),
	C = A.childNodes.child(0),
	B = C.childNodes.child(2)
;
	a.equal(C.tagName, 'CXL-HEADER-NAV');
	a.equal(C.childNodes.child(0).toString(), 'Ignored content');
	a.equal(C.childNodes.child(1).child(0).toString(), 'Hello');
	a.equal(C.childNodes.child(3).child(0).toString(), 'Hello 2');
	a.equal(B.get('href'), 'hello');
	a.equal(C.childNodes.indexOf(B), 2);
	// Remove
	A.set('test', false);
	$$render();
	a.equal(C.childNodes.length, 4);
	a.equal(C.childNodes.child(0).toString(), 'Ignored content');
	a.equal(C.childNodes.child(1).child(0).toString(), 'Hello');
	a.equal(C.childNodes.child(3).child(0).toString(), 'Hello 2');
	// Reinsert
	A.set('test', true);
	$$render();
	a.ok(B.parent);
	a.equal(C.childNodes.indexOf(B), 2);
});*/

QUnit.test('each - array', function(a) {
var
	list = [ 'First Item', 'Second Item', 'Third Item' ],
	ul = $$compile(
		'<template &="=list:each:repeat"><b &="item:text"></b></template>',
		{ list: list }).host
;
	a.equal(ul.childNodes.length, 4);
	a.equal(ul.firstChild.innerHTML, list[0]);
	a.equal(ul.childNodes[1].innerHTML, list[1]);
	a.equal(ul.childNodes[2].innerHTML, list[2]);
});

QUnit.test('item.each - array', function(a) {
var
	list = [ 'First Item', 'Second Item', 'Third Item' ],
	ul = $$compile(
		'<template &="=list:item.each:repeat"><b &="$value:text"></b></template>',
		{ list: list }).host
;
	a.equal(ul.childNodes.length, 4);
	a.equal(ul.firstChild.innerHTML, list[0]);
	a.equal(ul.childNodes[1].innerHTML, list[1]);
	a.equal(ul.childNodes[2].innerHTML, list[2]);
});

/*QUnit.test('list - array', function(a) {
var
	list = [ 'First Item', 'Second Item', 'Third Item' ],
	ul = $$compile(
		'<template &="=list:observe:list"><b &="item:text"></b></template>',
		{ list: list }).host
;
	// Fragment adds a comment node
	a.equal(ul.childNodes.length, 4, 'Should have 4 nodes');
	a.equal(ul.firstChild.innerHTML, list[0]);
	a.equal(ul.childNodes[1].innerHTML, list[1]);
	a.equal(ul.childNodes[2].innerHTML, list[2]);
	/*
	a.equal(ul.child(1).child(0).toString(), list[1]);
	a.equal(ul.child(2).child(0).toString(), list[2]);

	collection.remove(1);

	a.equal(ul.childNodes.length, 3);
	a.equal(list[0], 'First Item');
	a.equal(list[1], 'Third Item');
	a.equal(ul.child(0).child(0).toString(), list[0]);
	a.equal(ul.child(1).child(0).toString(), list[1]);

	collection.insert('Fourth Item');
	$$render();
	a.equal(ul.childNodes.length, 4);
	a.equal(ul.child(2).child(0).toString(), 'Fourth Item');

	collection.insert('One and a Half', 1);
	$$render();
	a.equal(ul.child(1).child(0).toString(), 'One and a Half');
});

QUnit.test('list - collection', function(a) {
var
	list = [ 'First Item', 'Second Item', 'Third Item' ],
	collection = new cxl.rx.Collection(list),
	view = $$compile(
		'<template &="&list:list"><b &="item:text"></b></template>',
		{ list: collection }),
	ul = view.host
;
	// Fragment adds a comment node
	a.equal(ul.childNodes.length, 4, 'Should have 4 nodes');
	a.equal(ul.firstChild.innerHTML, list[0]);
	a.equal(ul.childNodes[1].innerHTML, list[1]);
	a.equal(ul.childNodes[2].innerHTML, list[2]);

	collection.remove(list[1]);

	a.equal(ul.childNodes.length, 3);
	a.equal(list[0], 'First Item');
	a.equal(list[1], 'Third Item');
	a.equal(ul.firstChild.firstChild.data, list[0]);
	a.equal(ul.childNodes[1].firstChild.data, list[1]);

	collection.insert('Fourth Item');
	$$render(view);
	a.equal(ul.childNodes.length, 4);
	a.equal(ul.childNodes[2].firstChild.data, 'Fourth Item');

	collection.insert('One and a Half', list[1]);
	$$render(view);
	a.equal(ul.childNodes[1].firstChild.data, 'One and a Half');
});

QUnit.test('list - collection multiple nodes', function(a) {
var
	list = [ 'First Item', 'Second Item', 'Third Item' ],
	collection = new cxl.rx.Collection(list),
	tpl = $$compile('<ul><cxl-fragment &="&collection:list"><li &="item:text"></li>' +
		'<li &="$length:text"></li></cxl-fragment></ul>',
		{ list: list, collection: collection }),
	ul = tpl.host.firstChild
;
	a.equal(ul.childNodes.length, 7);
	a.equal(ul.firstChild.firstChild.data, list[0]);
	a.equal(ul.childNodes[1].firstChild.data, list[0].length);
	a.equal(ul.childNodes[2].firstChild.data, list[1]);
	a.equal(ul.childNodes[5].firstChild.data, list[2].length);

	collection.remove(list[1]);

	a.equal(ul.childNodes.length, 5);
	a.equal(list[0], 'First Item');
	a.equal(list[1], 'Third Item');
	a.equal(ul.firstChild.firstChild.data, list[0]);
	a.equal(ul.childNodes[2].firstChild.data, list[1]);

	collection.insert('Fourth Item');
	$$render(tpl);
	a.equal(ul.childNodes.length, 7);
	a.equal(ul.childNodes[4].firstChild.data, 'Fourth Item');

	collection.insert('One and a Half', list[1]);
	$$render(tpl);
	a.equal(ul.childNodes[2].firstChild.data, 'One and a Half');
});

/*
QUnit.test('list - collection', function(a) {
var
	list = {
		key1: { name: 'Collection Item key1' },
		key2: { name: 'Collection Item key2' },
		key3: { name: 'Collection Item key3' }
	},
	collection = new cxl.rx.ObjectCollection(list),
	ul = cxl.compile('<ul><cxl-fragment &="collection(collection):list"><li &="item(name):text"></li>' +
		'<li &="key:text"></li><li &="index:text"></li></cxl-fragment></ul>', { collection: collection }).child(0)
;
	$$render();
	a.equal(ul.childNodes.length, 10);
	a.equal(ul.child(0).child(0).toString(), list.key1.name);
	a.equal(ul.child(1).child(0).toString(), 'key1');
	a.equal(ul.child(2).child(0).toString(), 0);
	a.equal(ul.child(3).child(0).toString(), list.key2.name);
	a.equal(ul.child(4).child(0).toString(), 'key2');
	a.equal(ul.child(5).child(0).toString(), 1);
	a.equal(ul.child(6).child(0).toString(), list.key3.name);
	a.equal(ul.child(7).child(0).toString(), 'key3');
	a.equal(ul.child(8).child(0).toString(), 2);

	collection.remove('key2');
	$$render();
	a.equal(ul.childNodes.length, 7);
	a.equal(ul.child(0).child(0).toString(), list.key1.name);
	a.equal(ul.child(1).child(0).toString(), 'key1');
	a.equal(ul.child(2).child(0).toString(), 0);
	a.equal(ul.child(3).child(0).toString(), list.key3.name);
	a.equal(ul.child(4).child(0).toString(), 'key3');
	a.equal(ul.child(5).child(0).toString(), 1);
});

QUnit.test('list - component parameters', function(a) {
var
	list = [ 'First Item', 'Second Item', 'Third Item' ],
	collection = new cxl.rx.Collection(list),
	tpl = $$compile('<ul><cxl-fragment &="&collection:list">' +
		'<cxl-button &="item:text:@title"></cxl-button></cxl-fragment></ul>',
		{ collection: collection }),
	ul = tpl.host.firstChild
;
	a.equal(ul.childNodes.length, 4);
	a.equal(ul.childNodes[0].firstChild.data, 'First Item');
	a.equal(ul.childNodes[0].getAttribute('title'), 'First Item');
	a.equal(ul.childNodes[1].title, 'Second Item');
	a.equal(ul.childNodes[2].title, 'Third Item');
});
*/

/*
QUnit.test('out', function(a) {

	cxl.component({
		name: 'demo-child',
		attributes: [ 'input', 'output' ],
		bindings: [ '=input:#toUpper:=output' ]
	}, {
		toUpper: function(val) { return val.toUpperCase(); }
	});

	cxl.component({
		name: 'demo-parent',
		template: '<demo-child &="=input:set(input) get(output):=output"></demo-child>'
	}, {
		input: 'hello'
	});

	var comp = dom('demo-parent');
	$$render();
	a.equal(comp.get('output'), "HELLO");

	comp.set('input', 'world');
	$$render();
	a.equal(comp.get('output'), 'WORLD');
});

/*QUnit.test('if', function(a) {
	var tpl, div;
	var scope = { local: false, msg: 'Success' };

	tpl = cxl.compile('<div><div &="=local:show"></div></div>', scope);
	div = tpl.child(0);
	$$render();

	a.equal(div.childNodes.length, 1);
	tpl.destroy();

	scope = { local: undefined, msg: 'Success' };
	tpl = cxl.compile('<div &="=local:show"></div>', scope);

	$$render();
	a.ok(!tpl.child(0).tagName);
	tpl.destroy();

	scope = { local: true, msg: 'Success' };
	tpl = cxl.compile('<div &="=local:show =msg:text"></div>', scope);

	$$render();
	a.ok(tpl.child(0).tagName);
	a.equal(tpl.child(0).child(0).toString(), scope.msg);
	tpl.destroy();
});

QUnit.test('if - shadow', function(a) {
var
	Component = cxl.component({
		template: '<div &="=test:show"></div>'
	}),
	A = new Component({ test: true }),
	DIV = A.$shadowRoot.child(0)
;
	a.equal(DIV.parent, A.$shadowRoot);
	A.set('test', false);
	$$render();
	a.ok(!DIV.parent);
	A.set('test', true);
	$$render();
	a.ok(DIV.parent);
});*/

QUnit.test('call', function(a) {
var
	done = a.async(),
	scope = {
		value: 'hello',
		local: function(val) {
			return val.toUpperCase();
		},
		last: function(val)
		{
			a.equal(val, 'HELLO');
			done();
		}
	},
	A = $$compile('<div><div &="=value:#local:#last"></div></div>', scope)
;
	$$render(A);
});

QUnit.test('cxl.dom() - Native Elements', function(a) {
var
	el = cxl.dom('DIV')
;
	a.equal(el.tagName, 'DIV');
});

QUnit.test('trigger()', function(a) {
var
	A = cxl.dom('INPUT'),
	done = a.async()
;
	new cxl.EventListener(A, 'test', function(e) {
		a.ok(e);
		done();
	});

	cxl.dom.trigger(A, 'test');
});

QUnit.test('dom.query()', function(a) {
var
	V = $$compile('<cxl-t>Text <cxl-p></cxl-p><cxl-p><cxl-p></cxl-p></cxl-p>'),
	result = cxl.dom.query(V.host, 'cxl-p')
;
	a.ok(result);
	a.equal(result.length, 3);

});

QUnit.test('compile()', function(a) {
var
	A = new cxl.Template('<ul><li>Hello</li><li>World</li></ul>'),
	C = cxl.dom('SPAN'),
	D = cxl.dom('CXL-TEST'),
	B = A.compile(D.$view)
;
	cxl.dom.insert(C, B);
	a.equal(C.childNodes.length, 1);

});

QUnit.module('directives');

function testDirective(name, a)
{
var
	el = document.createElement('cxl-input'),
	param = 'value',
	view = new cxl.View({}, el),
	//value = 'test',
	d
;
	$$fixture().appendChild(el);
	d = new cxl.compiler.directives[name](el, param, view);
	a.ok(d);

	//d.next(value);
	//a.equal(d.value, value);
}

for (var i in cxl.compiler.directives)
	QUnit.test(i, testDirective.bind(null, i));

/*QUnit.test('collection', function(a) {
var
	scope = { list: [ 1,2 ,3 ]},
	c = $$compile('<ul><cxl-fragment &="collection(list):list"><li &="item:text"></li></cxl-fragment></ul>', scope),
	ul = c.host.firstChild
;
	a.equal(ul.childNodes.length, 4);
	c.set('list', [ ]);
	$$render(c);
	a.equal(ul.childNodes.length, 1);
	c.set('list', [ 1, 2, 3, 4, 5]);
	$$render(c);
	a.equal(ul.childNodes.length, 6);
	c.set('list', null);
	$$render(c);
	a.equal(ul.childNodes.length, 1);

});*/

