import { ComponentTest, Test, spec } from '../spec/index.js';
import { on } from '../dom/index.js';
import { dom, connect } from '../xdom/index.js';
import { getRegisteredComponents, Component } from '../component/index.js';
import { tap } from '../rx/index.js';
import './index.js';

function testStringValue(test: ComponentTest) {
	test.test('[value] string', (a: Test) => {
		a.dom.innerHTML = `<${test.tagName} value="initial" />`;
		const el = a.dom.firstChild as HTMLInputElement;
		a.assert(el);
		a.equal(el.value, 'initial');
		el.value = 'Hello World';
		a.equal(el.value, 'Hello World', 'value should be set immediately');
	});
}

function testBooleanValue(test: ComponentTest) {
	test.test('[value] boolean', (a: Test) => {
		a.dom.innerHTML = `<${test.tagName} value />`;
		const el = a.dom.firstChild as any;
		a.assert(el);
		a.equal(el.value, true);
		el.value = false;
		a.equal(el.value, false, 'value should be set immediately');
	});
}

function testValue(a: ComponentTest<HTMLInputElement>) {
	const el1 = a.element();
	if (typeof el1.value === 'string') testStringValue(a);
	else if (el1.value === false || el1.value === true) testBooleanValue(a);

	a.testEvent('change', el => (el.value = 'Change Event'));
}

function testChecked(test: ComponentTest<HTMLInputElement>) {
	test.test('[checked]', a => {
		const c = test.element();
		const resolve = a.async();
		a.equal(c.checked, false, 'Should be false by default');
		a.equal(
			c.getAttribute('aria-checked'),
			'false',
			'[aria-checked] must be set to "false" if [checked] is false.'
		);
		function handler() {
			a.equal(c.checked, true, '"change" event fired');
			a.equal(
				c.getAttribute('aria-checked'),
				'true',
				'[aria-checked] must be set to "true" if [checked] is true.'
			);
			c.removeEventListener('change', handler);
			resolve();
		}
		c.addEventListener('change', handler);
		c.checked = true;
	});
}

type FocusableElement = HTMLInputElement & { touched: boolean };

function testTouched(test: ComponentTest<FocusableElement>) {
	test.test('[touched]', a => {
		const c = test.element();
		a.equal(c.touched, false);
		c.focus();
		a.ok(c.matches(':focus-within'), 'Element is focused');

		const unfocus = document.createElement('input');
		a.dom.appendChild(unfocus);
		unfocus.focus();
		a.equal(c.touched, true, 'Element should be marked as touched on blur');
		a.ok(!c.matches(':focus-within'), 'Element was unfocused');
	});
}

function testDisabled(test: ComponentTest<FocusableElement>) {
	test.test('[disabled]', a => {
		const el = test.element();
		a.equal(
			el.disabled,
			false,
			'Component should not be disabled by default'
		);
		a.equal(
			el.getAttribute('aria-disabled'),
			'false',
			'aria-disabled must be set to false by default'
		);
		el.disabled = true;
		a.ok(el.tabIndex === -1, 'Disabled Element is not focusable');
		a.ok(
			el.hasAttribute('disabled'),
			'Disabled attribute must be reflected'
		);
		a.equal(
			el.getAttribute('aria-disabled'),
			'true',
			'aria-disabled must be set'
		);

		a.ok(!el.matches(':focus'), 'Element remains unfocused');
		el.focus();
		a.ok(!el.matches(':focus'), 'Disabled element does not receive focus');
		a.equal(getComputedStyle(el).pointerEvents, 'none');
	});
}

function testButton(test: ComponentTest) {
	test.test('[role=button]', a => {
		const el = test.element();
		a.equal(el.tabIndex, 0);
	});
}

type Tester = (fn: ComponentTest<any>) => void;

const attributeTest: Record<string, Tester> = {
	disabled: testDisabled,
	value: testValue,
	checked: testChecked,
	touched: testTouched,
};

function testAttributes(attributes: string[], a: ComponentTest) {
	attributes.forEach(attr => {
		a.ok(attr.toLowerCase() === attr, `${attr} should be lowercase`);
		if (attr in attributeTest) (attributeTest as any)[attr](a);
	});
}

function testComponent(def: typeof Component, a: ComponentTest) {
	const el = a.element();
	const attributes = def.observedAttributes;

	a.equal(el.isConnected, true, 'Component element is connected');
	a.equal(el.tagName, a.tagName.toUpperCase());

	if (el.getAttribute('role') === 'button') testButton(a);
	if (attributes) testAttributes(attributes, a);
}

export default spec('ui', a => {
	const components = getRegisteredComponents();
	for (const tagName of Object.keys(components).sort()) {
		a.component(tagName, a => testComponent(components[tagName], a));
	}

	a.test('ripple', a => {
		let clickHandled = false;

		function ripple(el: HTMLElement) {
			el.title = 'hello';
			return on(el, 'click').pipe(tap(() => (clickHandled = true)));
		}

		connect(<div $={ripple}>Container</div>, el => {
			a.dom.appendChild(el);
			a.ok(el);
			el.click();
			a.equal(el.title, 'hello');
			a.ok(clickHandled);
		});
	});
});