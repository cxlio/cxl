import { TestApi, spec, triggerKeydown } from '@cxl/spec';
import { dom } from '@cxl/tsx';
import {
	Augment,
	Attribute,
	getRegisteredComponents,
	Component,
} from '@cxl/component';
import { each } from '@cxl/template';
import { be, of } from '@cxl/rx';
import {
	Drawer,
	Button,
	Checkbox,
	DialogAlert,
	DialogConfirm,
	Field,
	Form,
	Label,
	Input,
	MultiSelect,
	Radio,
	SelectBox,
	SubmitButton,
	Tabs,
	Tab,
	TextArea,
	Option,
	SnackbarContainer,
	Slider,
	alert,
	confirm,
	notify,
	setSnackbarContainer,
} from './index.js';
import carouselSpec from './spec/carousel.js';
import datepickerSpec from './spec/datepicker.js';
import tableSpec from './spec/table.js';
import snapshotSpec from './test-ui.js';
import { breakpoint, breakpointClass, focusDelegate } from './core.js';
import { theme } from './theme.js';

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
		const el = test.element(ctor.tagName) as Input;
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
		el.value = true;
		a.equal(el.value, true, 'value should be set immediately');
	});
}

function testValue(ctor: typeof Component, a: TestApi) {
	const el1 = a.element(ctor.tagName) as Input;
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

		if (c.value !== undefined) {
			a.test('checked attribute set', a => {
				a.dom.innerHTML = `<${ctor.tagName} checked>`;
				const c = a.dom.children[0] as any;
				a.equal(c.checked, true);
				a.equal(c.value, true);
			});

			a.test('value attribute set', a => {
				a.dom.innerHTML = `<${ctor.tagName} value>`;
				const c = a.dom.children[0] as any;
				a.equal(c.checked, true);
				a.equal(c.value, true);
			});
		}
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
		const el = test.element(ctor.tagName) as Input;
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

	a.addSpec(carouselSpec);
	a.addSpec(datepickerSpec);
	a.addSpec(tableSpec);
	a.addSpec(snapshotSpec);

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

		a.test(
			'initial value should remain as empty string if set',
			async a => {
				a.dom.innerHTML = `<cxl-select><cxl-option value="">Test</cxl-option></cxl-select>`;
				const el = a.dom.firstElementChild as SelectBox;
				await of(true).raf();
				a.equal(el.value, '');
			}
		);

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
			a.equal(el.options.size, 0);
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
			'should set selected to undefined if not found in options',
			async a => {
				a.dom.innerHTML = `<cxl-select value="b">
				<cxl-option value="">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-select>`;
				const select = a.dom.firstElementChild as SelectBox;
				a.equal(select.selected?.value, 'b');
				select.value = 'd';
				a.equal(select.selected, undefined);
				a.equal(select.value, 'd');
				select.removeChild(select.firstElementChild as any);
				a.equal(select.children.length, 2);
				a.equal(select.options?.size, 2);
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

		a.should('handle selectable.action event', a => {
			a.dom.innerHTML = `<cxl-select value="b">
				<cxl-option value="">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-select>`;
			const select = a.dom.firstElementChild as SelectBox;
			a.equal(select.selected?.value, 'b');
			const option2 = select.children[2] as Option;
			option2.click();
			a.equal(select.selected, option2);
			const option1 = select.children[1] as Option;
			option1.click();
			a.equal(select.selected, option1);
		});

		a.should('handle keyboard events', a => {
			a.dom.innerHTML = `<cxl-select value="b">
				<cxl-option value="">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-select>`;
			const select = a.dom.firstElementChild as SelectBox;
			a.equal(select.selected?.value, 'b');
			triggerKeydown(select, 'ArrowDown');
			a.equal(select.selected?.value, 'c');
			triggerKeydown(select, 'ArrowUp');
			triggerKeydown(select, 'ArrowUp');
			a.equal(select.selected?.value, '');
		});

		a.should('open select menu on action event', a => {
			a.dom.innerHTML = `<cxl-select value="b">
				<cxl-option value="">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-select>`;
			const select = a.dom.firstElementChild as SelectBox;
			select.click();
			a.equal(select.opened, true);
		});

		a.should('handle dynamic options', a => {
			const rows = be(5);
			const options = be([5, 10, 25, 50]);
			const el = (
				<SelectBox className="rows" value={rows}>
					{each(options, op => (
						<Option value={op}>{op.toString()}</Option>
					))}
				</SelectBox>
			) as SelectBox;
			a.dom.appendChild(el);
			a.equal(el.value, 5);
			a.ok(el.selected);
		});
	});

	a.test('cxl-multiselect', a => {
		a.test('no value', async (a: TestApi) => {
			a.dom.innerHTML = `<cxl-multiselect>
				<cxl-option value="a">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-multiselect>`;
			const select = a.dom.firstElementChild as MultiSelect;
			a.equal(select.options?.size, 3, 'Options should be set');
			a.equal(select.value?.length, 0);
		});

		a.test('should prevent leak of options change event', a => {
			const done = a.async();
			const el = document.createElement('cxl-multiselect') as MultiSelect;
			let firstEvent = true;
			el.innerHTML = `
				<cxl-option value="a">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
				<cxl-option value="d">D</cxl-option>`;
			el.addEventListener('change', ev => {
				a.equal((ev.target as any)?.tagName, 'CXL-MULTISELECT');
				if (firstEvent) firstEvent = false;
				else done();
			});
			a.dom.appendChild(el);
			el.value = ['c'];
		});

		a.test('should add options synchronously', a => {
			const el = a.element('cxl-multiselect') as MultiSelect;
			a.equal(el.children.length, 0);
			a.equal(el.options.size, 0);
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

		a.test('should have [] as initial value', a => {
			const el = a.element('cxl-multiselect') as MultiSelect;
			a.equal(el.value.length, 0);
		});

		a.test(
			'should set value to empty array if not found in options',
			async a => {
				a.dom.innerHTML = `<cxl-multiselect>
				<cxl-option value="">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-multiselect>`;
				const select = a.dom.firstElementChild as MultiSelect;
				a.equal(select.value.length, 0);
				select.value = ['d'];
				a.equal(select.selected.size, 0);
			}
		);

		a.should('open select menu on action event', a => {
			a.dom.innerHTML = `<cxl-multiselect value="b">
				<cxl-option value="">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-multiselect>`;
			const select = a.dom.firstElementChild as MultiSelect;
			select.click();
			a.equal(select.opened, true);
		});
		a.test('should support value types other than string', async a => {
			const el = (
				<MultiSelect>
					<Option value={2}>2</Option>
					<Option value={1}>1</Option>
					<Option value={false}>1</Option>
				</MultiSelect>
			) as MultiSelect;

			a.dom.appendChild(el);
			await of(1).raf();
			a.equal(el.value.length, 0);
			el.value = [1, false];
			await of(1).raf();
			a.ok(el.selected.has(el.children[2] as Option));
			a.ok(el.selected.has(el.children[1] as Option));
		});

		a.should('handle selectable.action event', a => {
			a.dom.innerHTML = `<cxl-multiselect>
				<cxl-option value="">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-multiselect>`;
			const select = a.dom.firstElementChild as MultiSelect;
			const option2 = select.children[2] as Option;
			option2.click();
			a.ok(select.selected.has(option2));
			const option1 = select.children[1] as Option;
			option1.click();
			a.ok(select.selected.has(option1));
			option1.click();
			a.ok(!select.selected.has(option1));
		});

		a.should('display placeholder if no options are selected', async a => {
			a.dom.innerHTML = `<cxl-multiselect placeholder="(Select)">
				<cxl-option value="a">A</cxl-option>
				<cxl-option value="b">B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-multiselect>`;
			const select = a.dom.firstElementChild as MultiSelect;
			await of(1).raf();
			const placeholderEl = select.shadowRoot?.querySelector(
				'.placeholder'
			) as HTMLElement;
			a.ok(placeholderEl?.innerText.includes('(Select)'));
		});

		a.should('handle preselected options', async a => {
			a.dom.innerHTML = `<cxl-multiselect>
				<cxl-option value="a" selected>A</cxl-option>
				<cxl-option value="b" selected>B</cxl-option>
				<cxl-option value="c">C</cxl-option>
			</cxl-multiselect>`;
			await of(1).raf();
			const select = a.dom.firstElementChild as MultiSelect;
			a.equalValues(select.value, ['a', 'b']);
			const placeholderEl = select.shadowRoot?.querySelector(
				'.placeholder'
			) as HTMLElement;
			await of(1).raf();
			a.ok(placeholderEl?.innerText.includes('A, B'));
		});
	});

	a.test('cxl-dialog-alert', a => {
		a.should('resolve promise on accept', async a => {
			const el = a.element('cxl-dialog-alert') as DialogAlert;
			const button = el.shadowRoot?.querySelector(
				'.footer cxl-button'
			) as Button;
			button?.click();
			await el.promise;
			a.ok(el);
		});
		a.should('show dialog with the alert function', async a => {
			const promise = alert(
				{
					message: 'Message',
					'title-text': 'Title',
					action: 'Action',
				},
				a.dom
			);
			const el = a.dom.querySelector('cxl-dialog-alert') as DialogAlert;
			const content = (el.shadowRoot?.querySelector(
				'.content'
			) as HTMLElement).innerText;
			a.ok(content.includes('Message'));
			a.ok(content.includes('Title'));
			el.resolve();
			await promise;
		});
		a.should('show dialog with the alert function', async a => {
			const promise = alert('Message', a.dom);
			const el = a.dom.querySelector('cxl-dialog-alert') as DialogAlert;
			const content = (el.shadowRoot?.querySelector(
				'.content'
			) as HTMLElement).innerText;
			a.ok(content.includes('Message'));
			el.resolve();
			await promise;
		});
	});

	a.test('cxl-dialog-confirm', a => {
		a.should('resolve promise on accept', a => {
			const done = a.async();
			const el = a.element('cxl-dialog-confirm') as DialogConfirm;
			const button = el.shadowRoot?.querySelector(
				'.footer cxl-button:nth-child(2)'
			) as Button;
			button.click();
			a.ok(el);
			el.promise.then(val => {
				a.equal(val, true);
				done();
			});
		});
		a.should('reject promise on cancel', a => {
			const done = a.async();
			const el = a.element('cxl-dialog-confirm') as DialogConfirm;
			const button = el.shadowRoot?.querySelector(
				'.footer cxl-button'
			) as Button;
			button?.click();
			a.ok(el);
			el.promise.then(val => {
				a.equal(val, false);
				done();
			});
		});
		a.should('show dialog with the confirm function', async a => {
			const promise = confirm(
				{
					message: 'Message',
					'title-text': 'Title',
					action: 'Action',
				},
				a.dom
			);
			const el = a.dom.querySelector('cxl-dialog-confirm') as DialogAlert;
			const content = (el.shadowRoot?.querySelector(
				'.content'
			) as HTMLElement).innerText;
			a.ok(content.includes('Message'));
			a.ok(content.includes('Title'));
			el.resolve();
			await promise;
		});
	});

	a.test('cxl-drawer', a => {
		a.should('close drawer on backdrop on click', a => {
			const el = a.element('cxl-drawer') as Drawer;
			const backdrop = el.shadowRoot?.querySelector(
				'cxl-backdrop'
			) as any;
			a.ok(!backdrop?.clientWidth);
			el.visible = true;
			a.ok(backdrop?.clientWidth);
			backdrop?.click();
			a.ok(!backdrop?.clientWidth);
		});
		a.should('not close on drawer click', a => {
			const el = a.element('cxl-drawer') as Drawer;
			const drawer = el.shadowRoot?.querySelector(
				'.drawer'
			) as HTMLElement;
			el.visible = true;
			drawer.click();
			a.ok(el.visible);
		});
	});

	a.test('notify', a => {
		const done = a.async();
		const container = (<SnackbarContainer />) as SnackbarContainer;
		a.dom.appendChild(container);
		setSnackbarContainer(container);
		a.ok(notify({ content: 'message', delay: 0 }).then(done));
	});

	a.test('cxl-slider', it => {
		it.should('change value on keypress', a => {
			const slider = (<Slider />) as Slider;
			a.dom.appendChild(slider);

			a.equal(slider.value, 0);
			triggerKeydown(slider, 'ArrowLeft');
			a.equal(slider.value, 0);
			triggerKeydown(slider, 'ArrowRight');
			triggerKeydown(slider, 'ArrowRight');
			a.equal(slider.value, 0.1);
			triggerKeydown(slider, 'ArrowLeft');
			a.equal(slider.value, 0.05);

			slider.step = 0.2;

			triggerKeydown(slider, 'ArrowLeft');
			a.equal(slider.value, 0);
			triggerKeydown(slider, 'ArrowRight');
			triggerKeydown(slider, 'ArrowRight');
			a.equal(slider.value, 0.4);
			triggerKeydown(slider, 'ArrowRight');
			triggerKeydown(slider, 'ArrowRight');
			triggerKeydown(slider, 'ArrowRight');
			a.equal(slider.value, 1);
		});
	});

	a.test('cxl-chip', it => {
		it.should(
			'remove itself if removable attribute is set and delete or backspace is pressed',
			a => {
				a.dom.innerHTML = `
				<cxl-chip removable></cxl-chip>
				<cxl-chip removable></cxl-chip>
			`;
				const chip1 = a.dom.children[0];
				const chip2 = a.dom.children[1];

				triggerKeydown(chip1, 'Delete');
				a.ok(!chip1.parentNode);
				triggerKeydown(chip2, 'Backspace');
				a.ok(!chip2.parentNode);
			}
		);
	});

	a.test('cxl-field', it => {
		it.should('focus containing element on click', a => {
			const el = (
				<Field>
					<Label>Label</Label>
					<Input />
				</Field>
			) as Field;
			a.dom.appendChild(el);
			a.ok(!el.children[1].matches(':focus-within'));
			el.click();
			a.ok(el.children[1].matches(':focus-within'));
		});
	});

	a.test('cxl-form', it => {
		it.should('submit when enter key is pressed', a => {
			const el = (
				<Form>
					<Input invalid />
				</Form>
			) as Form;
			let called = false;
			const input = el.children[0] as Input;

			a.dom.appendChild(el);
			triggerKeydown(input, 'Enter');
			a.ok(input.matches(':focus-within'));
			input.invalid = false;
			el.addEventListener('submit', () => {
				called = true;
			});
			triggerKeydown(input, 'Enter');
			a.ok(called);
		});

		it.should('submit on form.submit', a => {
			const el = (
				<Form>
					<SubmitButton />
				</Form>
			) as Form;
			let called = false;
			const button = el.children[0] as Input;

			a.dom.appendChild(el);
			el.addEventListener('submit', () => (called = true));
			button.click();
			a.ok(called);
		});

		it.should('get form data from child inputs', a => {
			const el = (
				<Form>
					<Input name="input1" value="value1" />
					<Input name="input2" value="value2" />
				</Form>
			) as Form;
			a.dom.appendChild(el);

			const data = el.getFormData();

			a.equal(data.input1, 'value1');
			a.equal(data.input2, 'value2');
		});
	});

	a.test('cxl-radio', it => {
		it.should('group radio buttons that share the same name', a => {
			a.dom.innerHTML = `
				<cxl-radio name="rad" value="1"></cxl-radio>
				<cxl-radio checked name="rad" value="2"></cxl-radio>
				<cxl-radio name="rad" value="3"></cxl-radio>
				<cxl-radio name="rad" value="4"></cxl-radio>
			`;
			const r1 = a.dom.children[0] as Radio;
			const r2 = a.dom.children[1] as Radio;
			const r3 = a.dom.children[2] as Radio;
			const r4 = a.dom.children[3] as Radio;

			a.equal(r2.checked, true);
			a.equal(r1.checked, false);
			a.equal(r3.checked, false);
			a.equal(r4.checked, false);
			r1.click();
			a.equal(r1.checked, true);
			a.equal(r2.checked, false);
			a.equal(r3.checked, false);
			a.equal(r4.checked, false);
			r3.click();
			a.equal(r1.checked, false);
			a.equal(r2.checked, false);
			a.equal(r3.checked, true);
			a.equal(r4.checked, false);
			r4.click();
			a.equal(r1.checked, false);
			a.equal(r2.checked, false);
			a.equal(r3.checked, false);
			a.equal(r4.checked, true);
		});
	});

	a.test('cxl-checkbox', it => {
		it.test('[indeterminate] attribute set', a => {
			a.dom.innerHTML = `<cxl-checkbox indeterminate></cxl-checkbox>`;
			const c = a.dom.children[0] as Checkbox;
			a.equal(c.value, undefined);
			a.equal(c.indeterminate, true);
		});

		it.test('[indeterminate] action handling', a => {
			a.dom.innerHTML = `<cxl-checkbox indeterminate></cxl-checkbox>`;
			const c = a.dom.children[0] as Checkbox;
			c.click();
			a.equal(c.value, false);
			a.equal(c.checked, false);
			a.equal(c.indeterminate, false);
			c.click();
			a.equal(c.value, true);
			a.equal(c.checked, true);
			a.equal(c.indeterminate, false);
		});
	});

	a.test('cxl-tabs', it => {
		it.should('switch tabs when a child tab is selected', a => {
			a.dom.innerHTML = `<cxl-tabs><cxl-tab>Tab1</cxl-tab><cxl-tab selected>Tab2</cxl-tab></cxl-tabs>`;
			const el = a.dom.firstElementChild as Tabs;
			const tab1 = el.children[0] as Tab;
			const tab2 = el.children[1] as Tab;
			a.equal(el.selected, tab2);
			tab1.selected = true;
			a.equal(el.selected, tab1);
		});
	});

	a.test('breakpointClass', it => {
		it.should('set element class when element resizes', a => {
			let expected = 'xsmall';
			const done = a.async();
			const el = (<div />) as HTMLDivElement;
			a.dom.appendChild(el);
			const subs = breakpointClass(el).subscribe(bp => {
				a.equal(bp, expected);
				a.equal(el.className, bp);

				if (bp === 'xsmall') expected = 'small';
				else if (bp === 'small') expected = 'medium';
				else if (bp === 'medium') expected = 'large';
				else if (bp === 'large') expected = 'xlarge';
				else if (bp === 'xlarge') {
					subs.unsubscribe();
					return done();
				}

				el.style.width = `${(theme.breakpoints as any)[expected]}px`;
			});
			el.style.width = `10px`;
		});
	});

	a.test('breakpoint', it => {
		it.should('emit resize events if breakpoints', a => {
			let expected = 'xsmall';
			const done = a.async();
			const el = (<div />) as HTMLDivElement;
			a.dom.appendChild(el);
			const subs = breakpoint(el).subscribe(bp => {
				a.equal(bp, expected);
				if (bp === 'xsmall') expected = 'small';
				else if (bp === 'small') expected = 'medium';
				else if (bp === 'medium') expected = 'large';
				else if (bp === 'large') expected = 'xlarge';
				else if (bp === 'xlarge') {
					subs.unsubscribe();
					return done();
				}

				el.style.width = `${(theme.breakpoints as any)[expected]}px`;
			});
			el.style.width = `10px`;
		});
	});
	a.test('focusDelegate', it => {
		it.should('delegate focus to a different element', a => {
			@Augment<FocusableHost>(`cxl-test2-${it.id}`)
			class FocusableHost extends Component {
				@Attribute()
				disabled = false;
				touched = false;
			}

			const A = (<FocusableHost />) as FocusableHost;
			const B = (<input />) as HTMLInputElement;
			const subs = focusDelegate(A, B).subscribe();

			a.equal(B.disabled, false);
			A.disabled = true;
			a.equal(B.disabled, true);

			subs.unsubscribe();
		});
	});
});
