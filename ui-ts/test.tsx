/// <amd-module name="index" />
import { suite, Test } from '../tester/index.js';
import {
	getRegisteredComponents,
	ComponentDefinition
} from '../component/index.js';
import './index.js';

function testValue(c: HTMLInputElement, a: Test) {
	a.test('@value', a2 => {
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
	test.test('@disabled', a => {
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

function testComponent(name: string, def: ComponentDefinition<any>, a: Test) {
	const { attributes } = def;
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
	components.forEach((def, tagName) => {
		if (typeof tagName === 'string')
			test(tagName, a => {
				testComponent(tagName, def, a);
			});
	});
});
