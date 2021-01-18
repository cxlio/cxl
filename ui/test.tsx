import { TestApi, spec } from '@cxl/spec';
import { on } from '@cxl/dom';
import { dom } from '@cxl/tsx';
import { getRegisteredComponents, Component } from '@cxl/component';
import '@cxl/template';
import { of } from '@cxl/rx';
import { TextArea, InputBase, Span, SelectBox, Option } from './index.js';

async function connect<T extends Node>(el: T, callback: (el: T) => any) {
	await callback(el);
}

const Measure: Record<string, any> = {
	'CXL-APPBAR'(test: TestApi) {
		test.measure({
			'cxl-appbar': {
				height: '56px',
			},
		});
	},
};

function testInvalid(ctor: typeof Component, test: TestApi) {
	test.test('[invalid]', a => {
		const el = test.element(ctor.tagName) as InputBase;
		a.equal(el.invalid, false, 'Should be valid by default');

		if (el.validity) {
			a.ok(el.validity.valid);
			el.setCustomValidity('Custom Validation');
			a.equal(el.invalid, true);
			a.ok(el.matches(':invalid'));
			a.ok(el.validity.customError);
			a.ok(!el.validity.valid);
			a.equal(el.validationMessage, 'Custom Validation');
			el.setCustomValidity('');
			a.equal(el.invalid, false);
			a.ok(el.matches(':valid'));
			a.ok(el.validity.valid);
			a.ok(!el.validity.customError);
			a.equal(el.validationMessage, '');
		}
	});
}

function testSlot(
	ctor: typeof Component,
	slot: HTMLSlotElement,
	test: TestApi
) {
	const name = slot.name;
	test.test(`<slot name=${name}>`, (a: TestApi) => {
		const done = a.async();
		const el = test.element(ctor.tagName);
		const child = document.createElement(name);

		a.assert(el.shadowRoot, 'Element has a shadow root');
		const newSlot = el.shadowRoot.querySelector(`slot[name="${name}"]`);

		a.ok(el.isConnected);
		a.assert(newSlot, 'Slot was created');
		newSlot.addEventListener('slotchange', () => {
			a.equal(child.slot, name);
			done();
		});
		el.appendChild(child);
	});
}

function testStringValue(ctor: typeof Component, test: TestApi) {
	test.test('[value] string', (a: TestApi) => {
		a.dom.innerHTML = `<${ctor.tagName} value="initial" />`;
		const el = a.dom.firstChild as HTMLInputElement;
		a.assert(el);
		a.equal(el.value, 'initial');
		el.value = 'Hello World';
		a.equal(el.value, 'Hello World', 'value should be set immediately');
	});
}

function testBooleanValue(ctor: typeof Component, test: TestApi) {
	test.test('[value] boolean', (a: TestApi) => {
		a.dom.innerHTML = `<${ctor.tagName} value />`;
		const el = a.dom.firstChild as any;
		a.assert(el);
		a.equal(el.value, true);
		el.value = false;
		a.equal(el.value, false, 'value should be set immediately');
	});
}

function testValue(ctor: typeof Component, a: TestApi) {
	const el1 = a.element(ctor.tagName) as InputBase;
	if (typeof el1.value === 'string') testStringValue(ctor, a);
	else if (el1.value === false || el1.value === true)
		testBooleanValue(ctor, a);

	a.testEvent(el1, 'change', el => (el.value = 'Change Event'));
}

function testChecked(ctor: typeof Component, test: TestApi) {
	test.test('[checked]', a => {
		const c = test.element(ctor.tagName) as HTMLInputElement;
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

function testTouched(ctor: typeof Component, test: TestApi) {
	test.test('[touched]', a => {
		const c = test.element(ctor.tagName) as FocusableElement;
		a.equal(c.touched, false);
		c.focus();
		a.ok(c.matches(':focus-within'), 'Element should be focused');

		const unfocus = document.createElement('input');
		a.dom.appendChild(unfocus);
		unfocus.focus();
		a.equal(c.touched, true, 'Element should be marked as touched on blur');
		a.ok(!c.matches(':focus-within'), 'Element was unfocused');
	});
}

function testDisabled(ctor: typeof Component, test: TestApi) {
	test.test('[disabled]', a => {
		const el = test.element(ctor.tagName) as InputBase;
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

function testButton(ctor: typeof Component, test: TestApi) {
	test.test('[role=button]', a => {
		const el = test.element(ctor.tagName);
		a.equal(el.tabIndex, 0);
	});
}

type Tester = (ctor: typeof Component, fn: TestApi) => void;

const attributeTest: Record<string, Tester> = {
	disabled: testDisabled,
	value: testValue,
	checked: testChecked,
	touched: testTouched,
	invalid: testInvalid,
};

function testAttributes(ctor: typeof Component, a: TestApi) {
	const attributes = ctor.observedAttributes;
	const set = new Set(attributes);

	a.equal(
		attributes.length,
		set.size,
		'Should not have duplicate attributes'
	);

	attributes.forEach(attr => {
		a.ok(attr.toLowerCase() === attr, `${attr} should be lowercase`);
		if (attr in attributeTest) (attributeTest as any)[attr](ctor, a);
	});
}

function testComponent(def: typeof Component, a: TestApi) {
	const el = a.element(def.tagName);
	const attributes = def.observedAttributes;

	a.equal(el.isConnected, true, 'Component element is connected');
	a.equal(el.tagName, def.tagName.toUpperCase());

	if (el.getAttribute('role') === 'button') testButton(def, a);
	if (attributes) testAttributes(def, a);
	if (el.tagName in Measure) Measure[el.tagName](a);

	const slots = el.shadowRoot?.querySelectorAll('slot[name^="cxl-"]');
	if (slots?.length) slots.forEach(s => testSlot(def, s as any, a));
}

export default spec('ui', a => {
	const components = getRegisteredComponents();
	for (const tagName of Object.keys(components).sort()) {
		a.test(tagName, a => testComponent(components[tagName], a));
	}

	a.test('cxl-textarea', a => {
		a.test('should support multiple lines', a => {
			const el = a.element('cxl-textarea') as TextArea;
			el.value = 'test';
			a.ok(el.value, 'test');
		});
	});

	a.test('cxl-option', a => {
		a.test('initial value should be empty string', a => {
			const el = a.element('cxl-option') as Option;
			a.equal(el.value, '');
		});

		a.test('initial value should remain as empty string if set', a => {
			a.dom.innerHTML = `<cxl-option value="">Test</cxl-option>`;
			const el = a.dom.firstElementChild as Option;
			a.equal(el.value, '');
		});
	});

	a.test('cxl-select', a => {
		a.test('no value', async (a: TestApi) => {
			a.dom.innerHTML = `<cxl-select>
				<cxl-option value="a">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-select>`;
			const select = a.dom.firstElementChild as SelectBox;
			a.equal(select.options?.size, 3, 'Options should be set');
			a.equal(select.value, 'a');
			await of(true).raf();
			a.equal(select.value, 'a');
			await of(true).raf();
			a.equal(select.value, 'a');
		});

		a.test('should prevent leak of options change event', a => {
			const done = a.async();
			const el = document.createElement('cxl-select') as SelectBox;
			let firstEvent = true;
			el.innerHTML = `
				<cxl-option value="a">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
				<cxl-option value="d">D</cxl-option>`;
			el.addEventListener('change', ev => {
				a.equal((ev.target as any)?.tagName, 'CXL-SELECT');
				a.equal((ev.target as any)?.value, firstEvent ? 'a' : 'c');
				if (firstEvent) firstEvent = false;
				else done();
			});
			a.dom.appendChild(el);
			el.value = 'c';
		});

		a.test('should add options synchronously', a => {
			const el = a.element('cxl-select') as SelectBox;
			a.equal(el.children.length, 0);
			a.ok(!el.options);
			el.appendChild(<Option>A</Option>);
			a.equal(el.children.length, 1);
			a.equal(el.options?.size, 1);
			el.appendChild(<Option>B</Option>);
			a.equal(el.children.length, 2);
			a.equal(el.options?.size, 2);
			el.removeChild(el.firstChild as any);
			a.equal(el.children.length, 1);
			a.equal(el.options?.size, 1);
			el.removeChild(el.firstChild as any);
			a.equal(el.children.length, 0);
			a.equal(el.options?.size, 0);
		});

		a.test('should have undefined as initial value', a => {
			const el = a.element('cxl-select') as SelectBox;
			a.equal(el.value, undefined);
		});

		a.test('attribute value set', async (a: TestApi) => {
			a.dom.innerHTML = `<cxl-select value="b">
				<cxl-option value="a">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-select>`;
			const select = a.dom.firstElementChild as SelectBox;
			a.equal(select.options?.size, 3);
			a.equal(select.selected?.value, 'b');
			a.equal(select.value, 'b');
			select.value = 'c';
			a.equal(select.selected?.value, 'c');
			a.equal(select.value, 'c');
			await of(true).raf();
			a.equal(select.selected?.value, 'c');
			a.equal(select.value, 'c');
		});

		a.test(
			'should set value to empty string if not found in options',
			async a => {
				a.dom.innerHTML = `<cxl-select value="b">
				<cxl-option value="">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-select>`;
				const select = a.dom.firstElementChild as SelectBox;
				a.equal(select.selected?.value, 'b');
				select.value = 'd';
				a.equal(select.selected?.value, '');
				a.equal(select.value, '');
				select.removeChild(select.firstElementChild as any);
				a.equal(select.children.length, 2);
				a.equal(select.options?.size, 2);
				await of(true).raf();
				a.ok(!select.selected);
				a.equal(select.value, '');
				select.value = 'f';
				a.ok(!select.selected);
				a.equal(select.value, '');
			}
		);

		a.test('should support value types other than string', a => {
			const el = (
				<SelectBox>
					<Option value={2}>2</Option>
					<Option value={1}>1</Option>
					<Option value={true}>1</Option>
				</SelectBox>
			) as SelectBox;

			a.dom.appendChild(el);
			a.equal(el.value, 2);
			el.value = 1;
			a.equal(el.selected?.value, 1);
			el.value = true;
			a.equal(el.selected?.value, true);
		});
	});

	a.test('ripple', a => {
		let clickHandled = false;

		function ripple(el: HTMLElement) {
			el.title = 'hello';
			return on(el, 'click').tap(() => (clickHandled = true));
		}

		connect(<Span $={ripple}>Container</Span>, (el: any) => {
			a.dom.appendChild(el);
			a.ok(el);
			el.click();
			a.equal(el.title, 'hello');
			a.ok(clickHandled);
		});
	});
});
