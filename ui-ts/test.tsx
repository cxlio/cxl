/// <amd-module name="index" />
import { suite, Test } from '../tester/index.js';
import { on } from '../dom/index.js';
import {
	dom,
	getRegisteredComponents,
	Component,
	render,
	Div
} from '../xdom/index.js';
import { tap } from '../rx/index.js';
import './index.js';

function testValue(c: HTMLInputElement, a: Test) {
	a.test('[value]', a2 => {
		const resolve = a.async();
		function handler() {
			a2.equal(c.value, 'Hello World', '"change" event fired');
			c.removeEventListener('change', handler);
		}
		c.addEventListener('change', handler);
		c.value = 'Hello World';
		resolve();
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
	test.test('[disabled]', a => {
		a.equal(
			el.disabled,
			false,
			'Component should never be disabled by default'
		);
		a.equal(el.tabIndex, 0);
		el.disabled = true;
		a.ok(el.tabIndex === -1, 'Disabled Element is not focusable');
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

	if (el.role === 'button') testButton(el, a);

	if (attributes) {
		if (attributes.includes('disabled')) testDisabled(el, a);
		if (attributes.includes('value')) testValue(el, a);
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

		const el = render(<Div $={ripple}>Container</Div>);
		a.dom.appendChild(el);
		a.ok(el);
		el.click();
		a.equal(el.title, 'hello');
		a.ok(clickHandled);
	});
});
