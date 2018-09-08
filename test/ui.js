
QUnit.module('ui');

(() => {

function testValue(c, a)
{
	c.value = "Hello World";

	c.addEventListener('change', ev => {
		a.equal(c.value, 'Hello World', '"change" event fired');
	});

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
		}
	});
}

function testFocus(c, a)
{
	const unfocus = document.createElement('select');
	$$fixture().appendChild(unfocus);

	a.equal(c.tabIndex, 0);
	c.focus();
	a.ok(c.matches(':focus'), 'Element can be focused');
	unfocus.focus();
	a.ok(!c.matches(':focus'), 'Element can be unfocused');

	a.equal(c.tabIndex, 0);
	a.ok('disabled' in c, 'Element can be disabled');
	c.disabled = true;
	$$render(c.$view);
	a.equal(c.tabIndex, -1);
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
	$$fixture().appendChild(c);
	a.ok(c.isConnected, 'Component connected');

	if (c.tabIndex!==-1)
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
		<cxl-submit &="id(submit)"></cxl-submit>
	</cxl-form>
</cxl-form>
		`, {
			one(ev) { a.equal(ev.type, 'submit'); },
			two(ev) { a.ok(ev); }
		})
;
	cxl.dom.trigger.$$old(A.state.submit, 'click');
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
	console.log(A);
	a.equal(A.state.test, 'yes');
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

