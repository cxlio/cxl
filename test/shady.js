/*jshint esnext:true */
QUnit.module('shady');

QUnit.test('attachShadow', function(a) {

	const id = 'cxl-' + a.test.testId;

	cxl.component({ name: id, template: 'Hello' });

var
	el = cxl.dom(id),
	shadow = el.shadowRoot
;
	a.equal(shadow.host, el);
	a.ok(shadow.childNodes !== el.childNodes);
	a.ok(!shadow.parentNode);
	a.equal(el.childNodes.length, 0);
});

QUnit.test('ShadowRoot#appendChild', function(a) {
	const id = 'cxl-' + a.test.testId;

	cxl.component({ name: id, template: 'hello' });

var
	el = cxl.dom(id),
	child = document.createElement('A'),
	child2 = document.createElement('B'),
	shadow = el.shadowRoot
;
	shadow.appendChild(child);
	a.equal(shadow.childNodes.length, 2);
	a.equal(el.childNodes.length, 0);
	a.equal(child.parentNode, shadow);
	a.ok(!el.firstChild);
	a.equal(shadow.childNodes[1], child);
	shadow.appendChild(child);
	a.equal(shadow.childNodes.length, 2);
	a.equal(el.childNodes.length, 0);
	a.equal(child.parentNode, shadow);
	shadow.appendChild(child2);
	a.equal(shadow.childNodes.length, 3);
	a.equal(el.childNodes.length, 0);
	a.equal(child2.parentNode, shadow);
	a.equal(child.nextSibling, child2);
});

QUnit.test('Component#appendChild', function(a) {
	const id = 'cxl-' + a.test.testId;

	cxl.component({ name: id, template: 'hello' });

var
	A = document.createElement('A'),
	SA = document.createElement('SA'),
	SB = document.createElement('SB'),
	el = cxl.dom(id),
	shadow = el.shadowRoot
;
	el.appendChild(A);
	shadow.appendChild(SA);
	shadow.appendChild(SB);

	a.ok(!A.nextSibling);
	a.equal(SA.nextSibling, SB);
	a.ok(!SB.nextSibling);
});

QUnit.test('Component slots', function(a) {
	const id = 'cxl-' + a.test.testId;

	cxl.component({ name: id, template: 'hello' });
var
	A = document.createElement('A'),
	SA = document.createElement('SA'),
	SB = document.createElement('SB'),
	el = cxl.dom(id),
	shadow = el.shadowRoot
;
	el.appendChild(A);
	shadow.appendChild(SA);
	shadow.appendChild(SB);

	a.ok(!A.nextSibling);
	a.equal(SA.nextSibling, SB);
	a.ok(!SB.nextSibling);
});

QUnit.test('parent - multiple level component', function(a) {

	const
		P = 'cxl-' + a.test.testId,
		C1 = P + '-child1'
	;

	cxl.component({
		name: C1,
		template: '<div &="content"></div>'
	});

	cxl.component({
		name: P,
		template: '<' + C1 + ' &="content">'
	});

	const
		A = cxl.dom(P),
		B = A.shadowRoot.firstChild,
		D = B.shadowRoot.firstChild
	;

	a.equal(A.childNodes.length, 0);
	a.equal(B.childNodes.length, 1);
	a.equal(B.parentNode, A.shadowRoot);
	a.equal(D.parentNode, B.shadowRoot);
	a.ok(!D.parentNode.parentNode);
	a.ok(!D.parentNode.parentNode);
	a.equal(B.firstChild.tagName, 'SLOT');
	a.equal(D.firstChild.tagName, 'SLOT');

});

QUnit.test('connect - DocumentFragment', function(a) {
const
	name = 'cxl-test' + a.test.testId,
	done = a.async(),
	C = cxl.component({
		name: name, connect() { this.test = 10; done(); }
	}),
	fragment = cxl.Template.getFragmentFromString('<' + name + '>'),
	cloned = fragment.cloneNode(true),
	b1 = fragment.childNodes[0],
	b2 = document.createElement(name),
	b3 = cxl.dom(name),
	b4 = cloned.childNodes[0],
	b5 = cxl.dom(name),
	fixture = document.getElementById('qunit-fixture')
;
	a.equal(b1.tagName, name.toUpperCase());
	a.ok(!b1.test);
	a.ok(!b2.test);
	a.ok(!b3.test);
	a.ok(!b4.test);

	fixture.appendChild(b5);
});

