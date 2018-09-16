
QUnit.module('ui');

(() => {

function testValue(c, a)
{
	c.addEventListener('change', handler);
	c.value = "Hello World";

	function handler() {
		a.equal(c.value, 'Hello World', '"change" event fired');
		c.removeEventListener('change', handler);
	}

	$$render(c.$view);
}

function testAttributes(c, def, a)
{
	const view = c.$view;

	def.attributes.forEach(attr => {
		if (attr!=='value')
		{
			c[attr] = true;
			$$render(view);
			a.equal(c[attr], true, `Attribute ${attr}`);

			const A = $$compile(`<${c.tagName} &="id(c)" ${attr}>`);
			a.ok(A.state.c[attr], `Attribute ${attr} initial value`);
		}
	});
}

function testFocus(c, a)
{
	const unfocus = document.createElement('select');
	$$fixture(unfocus);

	a.equal(c.tabIndex, 0, 'tabIndex is initially 0');
	c.focus();
	a.equal(document.activeElement, c, 'Element is focused');
	//a.ok(c.matches(':focus'), 'Element is focused');

	unfocus.focus();
	a.equal(document.activeElement, unfocus, 'Element was unfocused');
	//a.ok(!c.matches(':focus'), 'Element was unfocused');

	a.equal(c.tabIndex, 0);
	a.ok('disabled' in c, 'Element can be disabled');
	c.disabled = true;
	$$render(c.$view);
	a.ok(!c.getAttribute('tabindex'), 'Disabled Element is not focusable');
	a.ok(!c.matches(':focus'), 'Element remains unfocused');
	c.focus();
	a.ok(!c.matches(':focus'), 'Disabled element does not receive focus');

}

function testComponent(name, a)
{
var
	c = cxl.dom(name),
	def = cxl.componentFactory.components[name].meta
;
	a.ok(c, 'Component successfully created');
	$$fixture(c);
	a.ok(c.$view.isConnected, 'Component connected');

	if (c.hasAttribute('tabindex'))
		testFocus(c, a);

	if (def.attributes)
	{
		testAttributes(c, def, a);
		if (def.attributes.indexOf('value')!==-1)
			testValue(c, a);
	}

	return c;
}

for (var i in cxl.componentFactory.components)
	QUnit.test(i, testComponent.bind(null, i));

})();

QUnit.test('cxl-form - nested forms', function(a) {
var
	A = $$compile(`
<cxl-form &="on(submit):#one">
	<cxl-form &="on(submit):#two">
		<div &="id(submit)"></div>
	</cxl-form>
</cxl-form>
		`, {
			one(ev) { a.equal(ev.type, 'submit'); },
			two(ev) { a.ok(ev); }
		})
;
	cxl.dom.trigger(A.state.submit, 'submit');
	$$render(A);
});

QUnit.test('cxl-select - value attribute', function(a) {
var
	A = cxl.dom('cxl-select'),
	op1 = cxl.dom('cxl-option', { value: 'one' }),
	op2 = cxl.dom('cxl-option', { value: 'two' }),
	op3 = cxl.dom('cxl-option', { value: 'three' })
;
	A.appendChild(op1);
	A.appendChild(op2);
	A.appendChild(op3);

	$$fixture(A);

	a.ok(A);
	a.equal(A.value, null);
	A.value = 'two';
	$$render(A.$view);
	a.equal(A.value, 'two');
	a.equal(A.$view.state.selected, op2);

	// Invalid Value
	A.value = 'four';
	$$render(A.$view);
	a.equal(A.value, 'four');
	a.equal(A.$view.state.selected, null);
});

QUnit.test('cxl-select - preset value', function(a) {
var
	A = $$compile(`<cxl-select value="two">
	<cxl-option value="one"></cxl-option>
	<cxl-option value="two"></cxl-option>
	<cxl-option value="three"></cxl-option>
</cxl-select>`),
	select = A.host.firstChild
;
	a.ok(A);
	a.equal(select.value, 'two');
	a.equal(select.$view.state.selected.value, 'two');
});

QUnit.test('cxl-checkbox - checked true-value', function(a) {
var
	A = $$compile('<cxl-checkbox &="@value:=test" checked true-value="yes">')
;
	a.equal(A.state.test, 'yes');
});

QUnit.test('cxl-checkbox - value sets checked', function(a) {
var
	A = $$compile('<cxl-checkbox &="id(c) @checked:=test:log @value:log" value="yes" true-value="yes">')
;
	console.log(A, A.state.c.$view);
	a.equal(A.state.test, true);
});

QUnit.test('cxl-switch', function(a) {
var
	A = cxl.dom('cxl-switch')
;
	a.ok(A);

	A = $$compile('<cxl-switch &="id(el) @value:=test" checked>');
	a.ok(A.state.el);
	a.ok(A.state.el.checked);
	$$render(A);
	a.ok(A.state.test);
});

