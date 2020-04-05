import { suite, Test } from '../spec/index.js';
import { on } from '../dom/index.js';
import { dom, connect } from '../xdom/index.js';
import { getRegisteredComponents, Component } from '../component/index.js';
import { tap } from '../rx/index.js';
import './index.js';

function testValue(c: HTMLInputElement, a: Test) {
	a.test('[value]', a2 => {
		const resolve = a2.async();
		function handler() {
			a2.equal(c.value, 'Hello World', '"change" event fired');
			c.removeEventListener('change', handler);
			resolve();
		}
		c.addEventListener('change', handler);
		c.value = 'Hello World';
	});
}

function testChecked(c: HTMLInputElement, test: Test) {
	test.test('[checked]', a => {
		const resolve = a.async();
		a.equal(c.checked, false, 'Should be false by default');
		a.equal(c.getAttribute('aria-checked'), 'false');
		function handler() {
			a.equal(c.checked, true, '"change" event fired');
			a.equal(c.getAttribute('aria-checked'), 'true');
			c.removeEventListener('change', handler);
			resolve();
		}
		c.addEventListener('change', handler);
		c.checked = true;
	});
}

function testFocus(c: HTMLInputElement & { touched: boolean }, test: Test) {
	test.test('focusable', a => {
		const unfocus = document.createElement('input');

		a.equal(c.tabIndex, 0, 'tabIndex is initially 0');
		a.equal(c.touched, false);
		c.focus();
		a.ok(c.matches(':focus'), 'Element is focused');
		a.equal(c.touched, true);

		unfocus.focus();
		a.ok(!c.matches(':focus'), 'Element was unfocused');
	});
}

function testDisabled(el: HTMLInputElement, test: Test) {
	if (el.tabIndex !== 0) return;

	test.test('[disabled]', a => {
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
		a.equal(el.tabIndex, 0);
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

function testButton(el: HTMLButtonElement, test: Test) {
	test.test('[role=button]', a => {
		a.equal(el.tabIndex, 0);
	});
}

function testComponent(name: string, def: typeof Component, a: Test) {
	const attributes = def.observedAttributes;
	const el: any = document.createElement(name);

	a.equal(el.tagName, name.toUpperCase());
	a.dom.appendChild(el);
	a.equal(el.isConnected, true, 'Component element is connected');

	if (el.getAttribute('role') === 'button') testButton(el, a);

	if (attributes) {
		if (attributes.includes('disabled')) testDisabled(el, a);
		if (attributes.includes('value')) testValue(el, a);
		if (attributes.includes('checked')) testChecked(el, a);
	}

	if (el.tabIndex && el.tabIndex !== -1) testFocus(el, a);
}

export default suite('ui', test => {
	const components = getRegisteredComponents();
	for (const tagName in components) {
		test(tagName, a => {
			testComponent(tagName, components[tagName], a);
		});
	}

	test('ripple', a => {
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
