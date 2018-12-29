

QUnit.test('EventListener', function(a) {
var
	A = cxl.dom('INPUT'),
	done = a.async(),
	un = new cxl.EventListener(A, 'test', function(e) {
		a.ok(!e);
	})
;
	un.destroy();
	cxl.dom.trigger(A, 'test');

	new cxl.EventListener(A, 'test', function(e) {
		a.ok(e);
		done();
	});

	cxl.dom.trigger(A, 'test');
});

QUnit.test('insert() - Text', function(a) {
var
	A = cxl.dom('SPAN')
;
	cxl.dom.insert(A, "Hello World and <b>HTML</b>");
	a.equal(A.innerHTML, "Hello World and &lt;b&gt;HTML&lt;/b&gt;");
	a.equal(A.childNodes.length, 1);

});

QUnit.module('component');

QUnit.test('name - Register a Component', function(a) {

	cxl.component({ name: 'cxl-test' }, function() {
		this.test = 123;
	});
	cxl.component({ name: 'cxl-test2' }, { test: 1234 });
	cxl.component({ name: 'cxl-test3', attributes: ['test'] });

	var component = cxl.dom('cxl-test');

	a.equal(component.$view.state.test, 123);

	component = cxl.dom('cxl-test2');
	a.equal(component.$view.state.test, 1234);

	component = cxl.dom('cxl-test3', { test: 12345 });
	a.equal(component.test, 12345);
});

QUnit.test('template', function(a) {
	var id = 'cxl-test' + a.test.testId;

	cxl.component({
		name: id,
		template: '<h1 &="=test:text"></h1>' },
		{ test: 123 }
	);

	var component = cxl.dom(id);
	a.equal(component.$view.state.test, 123);
});

QUnit.test('templateId', function(a) {
const
	fromId = cxl.Template.fromId,
	name = 'cxl-' + a.test.testId
;

	cxl.Template.fromId = function(id)
	{
		return id==='template1' ? new cxl.Template('<div &="=test:text"></div>') :
			fromId(id);
	};

	cxl.component({
		name: name,
		templateId: 'template1'
	});

	var component = cxl.dom(name, { test: 123 });

	a.ok(component.$view.bindings.length);
	a.equal(component.test, 123);

	cxl.Template.fromId = fromId;
});

QUnit.test('attributes', function(a) {

	const name = 'cxl-' + a.test.testId;

	cxl.component({
		name: name,
		attributes: [ 'test' ]
	});

	var comp = $$compile('<' + name + ' &="id(A)" test="String"></' + name + '>');

	a.ok(comp.state.A.hasAttribute('test'));
	a.equal(comp.state.A.test, 'String');
});

QUnit.test('attributes - parent', function(a) {

	const name = 'cxl-' + a.test.testId;

	cxl.component({
		name: name,
		attributes: [ 'test' ]
	});

	var comp = $$compile('<' + name + ' &="id(A)" test="123">');
	a.equal(comp.state.A.test, 123);

	comp = $$compile('<' + name + ' &="id(A) =test:@test">', { test: 123 });
	a.equal(comp.state.A.test, 123);

	comp = $$compile('<' + name + ' &="id(A) =test:@test">', {
		test: "Hello World"
	});

	a.equal(comp.state.A.test, 'Hello World');
});

QUnit.test('bindings', function(a) {

	const name = 'cxl-' + a.test.testId;

	cxl.component({
		name: name,
		template: '<div &="id(A) =test:text =test:@test2">'
	}, { test: 123 });

	const C = cxl.dom(name), A = C.$view.state.A;

	$$render(C.$view);
	a.equal(A.firstChild.data, '123');
	a.equal(A.test2, 123);

});

QUnit.test('empty()', function(a) {

	cxl.component({
		name: 'cxl-demo'
	});

	var comp = $$compile('<cxl-demo &="id(A)"><div>Hello</div> <b>World</b></cxl-demo>');
	var A = comp.state.A;

	a.equal(A.childNodes.length, 3);
	cxl.dom.empty(A);
	a.equal(A.childNodes.length, 0);
	A.appendChild(cxl.dom('cxl-demo'));
	A.appendChild(cxl.dom('cxl-demo'));
	a.equal(A.childNodes.length, 2);
	cxl.dom.empty(A);
	a.equal(A.childNodes.length, 0);

});

QUnit.test('parent - catch all content slot', function(a) {

	var name = a.test.testId;

	cxl.component({
		name: 'cxl-' + name,
		template: '<div &="content"></div>'
	});

	var A = cxl.dom('cxl-' + name), B, C, D;

	B = A.shadowRoot.firstChild;
	D = cxl.dom('B');

	a.equal(A.childNodes.length, 0);
	a.equal(B.tagName, 'DIV');
	a.equal(B.childNodes.length, 1);
	a.equal(B.firstChild.tagName, 'SLOT');
	a.strictEqual(B.parentNode, A.shadowRoot);
	a.strictEqual(D.parentNode, null);

	A.appendChild(D);
	a.equal(D.parentNode, A);
	a.equal(A.childNodes.length, 1);
});

QUnit.test('parent - named content slot', function(a) {

	var name = a.test.testId;

	cxl.component({
		name: 'cxl-' + name,
		template: '<div &="content(b)"></div>'
	});

	var A = cxl.dom('cxl-' + name), B, C, D;

	B = A.shadowRoot.firstChild;
	D = cxl.dom('B');

	a.equal(A.childNodes.length, 0);
	a.equal(B.tagName, 'DIV');
	a.equal(B.childNodes.length, 1);
	a.equal(B.firstChild.tagName, 'SLOT');
	a.strictEqual(B.parentNode, A.shadowRoot);
	a.strictEqual(D.parentNode, null);

	A.appendChild(D);
	a.equal(D.parentNode, A);
	a.equal(A.childNodes.length, 1);
});

QUnit.test('parent - multiple content slots', function(a) {

	var name = a.test.testId;

	cxl.component({
		name: 'cxl-' + name,
		template: '<div &="content(b)"></div><span &="content"></span>'
	});

	var A = cxl.dom('cxl-' + name), B, C, D;

	B = A.shadowRoot.firstChild;
	C = A.shadowRoot.childNodes[1];
	D = cxl.dom('B');

	a.equal(A.childNodes.length, 0);
	a.equal(B.tagName, 'DIV');
	a.equal(B.childNodes.length, 1);
	a.equal(B.firstChild.tagName, 'SLOT');
	a.equal(C.tagName, 'SPAN');
	a.equal(C.childNodes.length, 1);
	a.equal(C.firstChild.tagName, 'SLOT');
	a.strictEqual(D.parentNode, null);
	a.strictEqual(C.parentNode, A.shadowRoot);

	A.appendChild(D);
	a.equal(D.parentNode, A);
	a.equal(A.childNodes.length, 1);

	D.parentNode.removeChild(D);
	a.ok(!D.parentNode);
	a.equal(A.childNodes.length, 0);
});

QUnit.test('parent - multiple level component', function(a) {

	const
		P = 'cxl-' + a.test.testId,
		C1 = P + '-child1',
		C2 = P + '-child2'
	;

	cxl.component({
		name: C2,
		template: '<div &="content"></div>'
	});

	cxl.component({
		name: C1,
		template: '<' + C2 + ' &="content">'
	});

	cxl.component({
		name: P,
		template: '<' + C1 + ' &="content">'
	});

	var A = cxl.dom(P);
	var B = A.shadowRoot.firstChild;
	var D = B.shadowRoot.firstChild;
	var E = D.shadowRoot.firstChild;
	var C = cxl.dom('span');

	var A2 = cxl.dom(P);
	var B2 = A2.shadowRoot.firstChild;
	var D2 = B2.shadowRoot.firstChild;
	var E2 = D2.shadowRoot.firstChild;

	a.equal(A.childNodes.length, 0);
	a.equal(B.childNodes.length, 1);
	a.equal(B.parentNode, A.shadowRoot);
	a.equal(D.parentNode, B.shadowRoot);
	a.ok(!D.parentNode.parentNode);
	a.ok(!D.parentNode.parentNode);
	a.equal(B.firstChild.tagName, 'SLOT');
	a.equal(D.firstChild.tagName, 'SLOT');

	A.appendChild(C);

	a.equal(C.parentNode, A);
	a.equal(A.childNodes.length, 1);
	a.equal(A.firstChild.tagName, 'SPAN');
	a.equal(A.firstChild, C);
	a.equal(B.childNodes.length, 1);
	a.equal(B.firstChild.tagName, 'SLOT');
	//a.equal(B.child(0).childNodes.length, 0);
	a.equal(D.childNodes.length, 1);
	a.equal(D.firstChild.tagName, 'SLOT');
	//a.equal(D.child(0).childNodes.length, 0);
	a.equal(E.firstChild.tagName, 'SLOT');
	//a.equal(E.child(0).childNodes.length, 0);

	C.parentNode.removeChild(C);

	a.equal(A.childNodes.length, 0);

	A.appendChild(C);

	a.equal(C.parentNode, A);
	a.equal(A.childNodes.length, 1);
	a.equal(B.childNodes.length, 1);
	a.equal(D.childNodes.length, 1);
	a.equal(E.childNodes.length, 1);

	A2.appendChild(C);

	a.equal(C.parentNode, A2);
	a.equal(A2.childNodes.length, 1);
	a.equal(B2.childNodes.length, 1);
	a.equal(D2.childNodes.length, 1);
	a.equal(E2.childNodes.length, 1);
});

QUnit.test('removeChild()', function(a) {

	const name = 'cxl-' + a.test.testId;

	cxl.component({
		name: name
	});

	var A = $$compile('<' +name+ ' &="id(A)"><div>Hello</div> <b>World</b></' + name +'>').state.A;

	a.equal(A.childNodes.length, 3);
	A.firstChild.parentNode.removeChild(A.firstChild);
	a.equal(A.childNodes.length, 2);
	a.equal(A.firstChild.data, ' ');
	A.removeChild(A.firstChild);
	a.equal(A.childNodes.length, 1);
	a.equal(A.firstChild.tagName, 'B');
	A.removeChild(A.firstChild);

	cxl.dom.insert(A, cxl.dom(name));
	cxl.dom.insert(A, cxl.dom(name));

	a.equal(A.childNodes.length, 2);
	var B = A.firstChild;
	a.ok(B.parentNode);
	B.parentNode.removeChild(B);
	a.equal(A.childNodes.length, 1);
	a.ok(!B.parentNode);
	A.removeChild(B = A.firstChild);
	a.ok(!B.parentNode);
});

QUnit.test('empty() - child components', function(a) {

	const
		parent = 'cxl-' + a.test.testId,
		child = parent + '-child'
	;

	cxl.component({
		name: child,
		template: '<div &="content"></div>'
	});

	cxl.component({
		name: parent,
		template: '<' + child + ' &="content">'
	});

	var A = cxl.dom(parent);
	var C = cxl.dom('span');

	a.equal(A.childNodes.length, 0);

	A.appendChild(C);
	A.appendChild(cxl.dom('b'));
	a.equal(C.parentNode, A);
	a.equal(A.childNodes.length, 2);

	cxl.dom.empty(A);

	a.equal(A.childNodes.length, 0);
	a.equal(C.parentNode, null);
});

QUnit.test('empty - multiple content slots', function(a) {

	var name = a.test.testId;

	cxl.component({
		name: 'cxl-' + name,
		template: '<div &="content(b)"></div><span &="content"></span>'
	});

	var
		A = cxl.dom('cxl-' + name),
		child1 = cxl.dom('B'),
		child2 = cxl.dom('SPAN')
	;

	cxl.dom.insert(A, child1);
	cxl.dom.insert(A, child2);
	a.equal(A.childNodes.length, 2);

	cxl.dom.empty(A);

	a.ok(!child1.parentNode);
	a.ok(!child2.parentNode);
	a.equal(A.childNodes.length, 0);
});

QUnit.test('Initialize Order', function(a) {
var
	i = 0,
	done = a.async(),
	nameA = $$tagName(),
	nameB = $$tagName(),
	nameC = $$tagName(),
	A = cxl.component({
		name: nameA,
		template: '<div></div>',
		initialize() { a.equal(i++, 2); done(); }}),
	B = cxl.component({
		name: nameB,
		template: `<${nameA}>`,
		initialize() { a.equal(i++, 1); }
	}),
	C = cxl.component({
		name: nameC,
		template: `<${nameB}>`,
		initialize() { a.equal(i++, 0); }
	}),
	view = $$compile(`<${nameC}>`)
;

});

QUnit.test('Digest Order', function(a) {
var
	i = 0,
	done = a.async(),
	nameA = $$tagName(),
	nameB = $$tagName(),
	nameC = $$tagName(),
	A = cxl.component({ name: nameA, template: '<div &="=test:#third"></div>'}, {
		third() { a.equal(i++, 0, 'Digest First'); }
	}),
	B = cxl.component({ name: nameB, template: `<${nameA} &="=test:#second">` }, {
		second() { a.equal(i++, 1, 'Digest Second'); }
	}),
	C = cxl.component({ name: nameC, template: `<${nameB} &="=test:#first">` }, {
		first() { a.equal(i++, 2, 'Digest Third'); done(); }
	}),
	view = $$compile(`<${nameC}>`)
;
});

QUnit.test('Connect Order', function(a) {
var
	i = 0,
	done = a.async(),
	nameA = $$tagName(),
	nameB = $$tagName(),
	nameC = $$tagName(),
	A = cxl.component({
			name: nameA,
			template: '<div></div>',
			bindings: 'connect:#connect'
		}, {
			connect() { a.equal(i++, 2); done(); }
		}),
	B = cxl.component({
			name: nameB,
			bindings: 'connect:#connect',
			template: `<${nameA}>`
		}, {
			connect() { a.equal(i++, 1); }
		}),
	C = cxl.component({
			name: nameC,
			bindings: 'connect:#connect',
			template: `<${nameB}>`
		}, {
			connect() { a.equal(i++, 0); }
		}),
	view = $$compile(`<${nameC}>`)
;
});

QUnit.test('Disconnect Order', function(a) {
var
	i = 0,
	done = a.async(),
	nameA = $$tagName(),
	nameB = $$tagName(),
	nameC = $$tagName(),
	A = cxl.component({
			name: nameA,
			template: '<div></div>',
			bindings: 'disconnect:#disconnect'
		}, {
			disconnect() { a.equal(i++, 2); done(); }
		}),
	B = cxl.component({
			name: nameB,
			template: `<${nameA}>`,
			bindings: 'disconnect:#disconnect'
		}, {
			disconnect() { a.equal(i++, 1); }
		}),
	C = cxl.component({
			name: nameC,
			template: `<${nameB}>`,
			bindings: 'disconnect:#disconnect'
		}, {
			disconnect() { a.equal(i++, 0); }
		}),
	view = $$compile(`<${nameC}>`)
;
	dom.remove(view.host);
});

QUnit.test('Lifecycle Order', function(a) {
var
	i = 0,
	done = a.async(),
	name = $$tagName(),
	A = cxl.component({
		name: name,
		attributes: [ 'test' ],
		bindings: 'connect:#connect disconnect:#disconnect',
		template: '<div &="=test:#digest"></div>',
		initialize() { a.equal(i++, 0, 'Initialize'); }
	}, {
		test: false,
		connect() {
			a.equal(i++, 2, 'Connect');
		},
		disconnect() { a.equal(i, 3, 'Disconnect'); done(); },
		digest() {
			a.equal(this.test, 'value', 'Attributes set before digest');
			a.equal(i++, 1, 'Digest');
		}
	}),
	view = $$compile(`<${name} test="value">`)
;
	dom.remove(view.host);
});