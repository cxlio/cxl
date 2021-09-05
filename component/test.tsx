import {
	Attribute,
	Augment,
	Component,
	Slot,
	StyleAttribute,
	connect,
	get,
	getRegisteredComponents,
	update,
	registerComponent,
	attributeChanged,
} from './index';
import { dom } from '@cxl/tsx';
import { be, observable, of, tap } from '@cxl/rx';
import { onChildrenMutation } from '@cxl/dom';
import { spec } from '@cxl/spec';

export default spec('component', a => {
	a.test('Component', it => {
		it.should('prioritize internal bindings', a => {
			let order = 0;
			const id = 'cxl-test' + a.id;
			@Augment(
				id,
				() => observable(() => a.equal(order++, 0)),
				() => observable(() => a.equal(order++, 1))
			)
			class Test extends Component {}

			const el = (
				<Test $={observable(() => a.equal(order++, 2))} />
			) as Test;
			el.bind(observable(() => a.equal(order++, 3)));
			a.dom.appendChild(el);
			a.equal((el as any).$$bindings.bindings.length, 4);
			a.equal((el as any).$$bindings.subscriptions.length, 4);

			order = 0;

			const el2 = (
				<Test $={observable(() => a.equal(order++, 2))} />
			) as Test;
			el2.bind(observable(() => a.equal(order++, 3)));
			a.dom.appendChild(el2);
			a.equal((el2 as any).$$bindings.bindings.length, 4);
			a.equal((el2 as any).$$bindings.subscriptions.length, 4);
		});
	});

	a.test('Component#Slot', it => {
		it.should('return a new slot element', a => {
			const done = a.async();
			const id = 'cxl-test' + a.id;
			@Augment(id)
			class Test extends Component {}
			const el = (<Test />) as Test;
			const slot = (
				<el.Slot selector="div"></el.Slot>
			) as HTMLSlotElement;
			const shadow = (<el.Shadow>{slot}</el.Shadow>) as Test;
			a.equal(shadow, el);
			a.equal(el.shadowRoot?.children[0], slot);

			el.bind(
				onChildrenMutation(el).tap(() => {
					a.equal(div.slot, slot.name);
					done();
				})
			);

			a.dom.appendChild(el);
			const div = (<div />) as HTMLDivElement;
			el.appendChild(div);
		});

		it.should('update after element is connected', a => {
			const done = a.async();
			const id = 'cxl-test' + Date.now();
			@Augment(id, $ => <$.Slot selector="div" />)
			class Test extends Component {}
			const html = `<${id}><div>Test</div></${id}>`;

			a.ok(Test);
			a.dom.innerHTML = html;
			const el = a.dom.children[0];
			const div = el.children[0];

			setTimeout(() => {
				a.equal(div.slot, 'div');
				done();
			});
		});
	});

	a.test('Component - empty', a => {
		class TestComponent extends Component {
			static tagName = 'div';
			bind() {
				/* */
			}
		}
		const element = <TestComponent />;
		a.ok(element);
		a.ok(element instanceof HTMLDivElement);
	});

	a.test('Component - register', a => {
		const id = 'cxl-test' + a.id;
		@Augment()
		class Test extends Component {
			static tagName = id;
		}
		const el = dom(id as any);
		a.ok(el);
		a.equal(el.tagName, id.toUpperCase());
		a.ok(el instanceof Test);
	});

	a.test('Component - template', a => {
		const id = 'cxl-test' + a.id;
		@Augment(id, _ => (
			<div>
				<slot></slot>
			</div>
		))
		class Test extends Component {}

		function tpl() {
			return (<Test>Hello World</Test>) as Test;
		}

		const el = tpl();
		a.dom.appendChild(el);
		a.ok(el.shadowRoot);
		a.equal(el.shadowRoot?.childNodes.length, 1);
		a.equal(el.shadowRoot?.children[0].tagName, 'DIV');
		a.equal(el.childNodes.length, 1);

		const el2 = tpl();
		a.dom.appendChild(el2);
		a.ok(el2.shadowRoot);
		a.equal(el2.shadowRoot?.childNodes.length, 1);
		a.equal(el2.shadowRoot?.children[0].tagName, 'DIV');
		a.equal(el2.childNodes.length, 1);
	});

	a.test('Slot', a => {
		const el = Slot();

		a.ok(el);
		a.ok(el instanceof HTMLSlotElement);
	});

	a.test('Augment - bind', a => {
		const id = 'cxl-test' + a.id;
		function bindTest(node: Test) {
			a.equal(node.tagName, id.toUpperCase());
			return of('hello').pipe(tap(val => (node.title = val)));
		}

		@Augment(bindTest)
		class Test extends Component {
			static tagName = id;
		}

		const el = (<Test></Test>) as Test;
		a.dom.appendChild(el);
		a.equal(el.title, 'hello');
		a.ran(2);
	});

	a.test('Component - inheritance', a => {
		const id = 'cxl-test' + a.id;

		class FocusBehavior extends Component {
			@Attribute()
			disabled = false;
			@Attribute()
			touched = false;
			@Attribute()
			focused = false;
		}

		class InputBase extends FocusBehavior {
			@Attribute()
			value = '';
			@Attribute()
			invalid = false;
			@Attribute()
			name = '';
		}

		@Augment()
		class Input extends InputBase {
			static tagName = id;

			@Attribute()
			maxlength = -1;

			focus() {
				// do nothing
			}
		}

		const instance = (<Input maxlength={10}></Input>) as Input;

		a.ok(instance);
		a.ok(Input.observedAttributes);
		a.ok(Input.observedAttributes.includes('invalid'));
		a.ok(Input.observedAttributes.includes('value'));
		a.ok(Input.observedAttributes.includes('disabled'));
		a.ok(Input.observedAttributes.includes('touched'));
		a.ok(Input.observedAttributes.includes('focused'));
		a.ok(Input.observedAttributes.includes('maxlength'));
		a.equal(instance.tagName, id.toUpperCase());
		a.equal(instance.invalid, false);
		a.equal(instance.maxlength, 10);
		a.equal(instance.name, '');
	});

	a.test('Attribute', a => {
		const id = 'cxl-test' + a.id;

		@Augment()
		class TestComponent extends Component {
			static tagName = id;

			@Attribute()
			test = true;
		}

		const el = (<TestComponent></TestComponent>) as TestComponent;
		a.equal(el.test, true);
		el.test = false;
		a.equal(el.test, false);

		const el2 = (
			<TestComponent test={false}></TestComponent>
		) as TestComponent;
		a.equal(el2.test, false);
		el2.test = true;
		a.equal(el2.test, true);
	});

	a.test('Attribute Initialization', a => {
		const id = 'cxl-test' + a.id;

		@Augment()
		class TestComponent extends Component {
			static tagName = id;
			@Attribute()
			'test-boolean' = false;
			@Attribute()
			'test-string' = 'string';
		}

		a.ok(TestComponent);
		a.dom.innerHTML = `<${id} test-boolean />`;
		const el = a.dom.firstChild as any;
		a.equal(el['test-boolean'], true);

		a.dom.innerHTML = `<${id} test-string="hello" />`;
		const el2 = a.dom.firstChild as any;
		a.equal(el2['test-string'], 'hello');
	});

	a.test('Attribute - multi word', a => {
		const id = 'cxl-test' + a.id;

		@Augment()
		class TestComponent extends Component {
			static tagName = id;
			@Attribute()
			'test-boolean' = false;
			@Attribute()
			'test-string' = 'string';
		}

		const el = (<TestComponent test-boolean={true} />) as TestComponent;
		a.equal(el['test-boolean'], true);
		el['test-boolean'] = false;
		a.equal(el['test-boolean'], false);
		el.setAttribute('test-boolean', '');
		a.equal(el['test-boolean'], true);
		el.removeAttribute('test-boolean');
		a.equal(el['test-boolean'], false);

		a.equal(el['test-string'], 'string');
		el.setAttribute('test-string', 'value');
		a.equal(el['test-string'], 'value');
	});

	a.test('Component - Attributes', a => {
		const id = 'cxl-test' + a.id;

		class Test extends Component {
			@Attribute()
			hello = 'world';
		}

		registerComponent(id, Test);

		a.ok(Test.observedAttributes.includes('hello'));

		const el = (<Test hello="hello" />) as Test;
		a.dom.appendChild(el);
		a.ok(el);
		a.equal(el.tagName, id.toUpperCase());
		a.equal(el.hello, 'hello');

		el.hello = 'hello';
		a.equal(el.hello, 'hello');
		const el3 = document.createElement(id) as Test;
		a.equal(el.hello, 'hello');
		a.equal(el3.hello, 'world');
	});

	a.test('Component - Attributes', a => {
		const id = 'cxl-test' + a.id;

		@Augment()
		class Test extends Component {
			static tagName = id;

			@Attribute()
			hello = 'world';
		}

		a.ok(Test.observedAttributes.includes('hello'));

		const el = (<Test hello="hello" />) as Test;
		a.ok(el);
		a.equal(el.tagName, id.toUpperCase());
		a.equal(el.hello, 'hello');

		el.hello = 'hello';
		a.equal(el.hello, 'hello');
		const el3 = document.createElement(id) as Test;
		a.equal(el.hello, 'hello');
		a.equal(el3.hello, 'world');
	});

	a.test('StyleAttribute - default', a => {
		const id = 'cxl-test' + a.id;

		@Augment()
		class Test extends Component {
			static tagName = id;

			@StyleAttribute()
			persist = true;
		}

		const el = (<Test />) as Test;
		a.equal(el.persist, true);
		a.dom.appendChild(el);
		a.ok(el.hasAttribute('persist'));
	});

	a.test('get', a => {
		const id = 'cxl-test' + a.id;

		@Augment()
		class Test extends Component {
			static tagName = id;

			@Attribute()
			hello = 'world';
		}

		a.ok(Test.observedAttributes.includes('hello'));

		const el = (<Test hello="hello" />) as Test;
		let lastValue = 'hello';
		a.equal(el.hello, 'hello');
		const subs = get(el, 'hello')
			.pipe(
				tap(val => {
					a.equal(val, lastValue);
				})
			)
			.subscribe();

		el.hello = lastValue = 'test';
		subs.unsubscribe();

		const s2 = get(el, 'hello')
			.pipe(
				tap(val => {
					a.equal(val, lastValue);
				})
			)
			.subscribe();

		el.hello = lastValue = 'test2';

		s2.unsubscribe();

		a.ran(6);
	});

	a.test('Attribute', a => {
		a.test('should work with getters and setters', a => {
			const id = 'cxl-test' + a.id;
			const setter = be(false);
			const event = be('');

			@Augment<Test>(id, $ => get($, 'attr').tap(val => event.next(val)))
			class Test extends Component {
				$attr = 'one';

				@Attribute()
				get attr() {
					return this.$attr;
				}

				set attr(val: string) {
					this.$attr = val;
					setter.next(true);
				}
			}
			const el = a.element(id) as Test;

			a.equal(el.attr, 'one');
			a.equal(el.$attr, 'one');
			a.equal(event.value, 'one');
			el.attr = 'two';
			a.equal(setter.value, true);
			a.equal(el.attr, 'two');
			a.equal(el.$attr, 'two');
			a.equal(event.value, 'two');
		});
	});

	a.test('connect', it => {
		it.should('emit when component is connected', a => {
			const id = `cxl-test${a.id}`;
			const done = a.async();
			let i = 0;

			@Augment(
				connect($ => {
					a.equal($.tagName, id.toUpperCase());
					if (i++ === 1) done();
				})
			)
			class Test extends Component {
				static tagName = id;
			}
			const el = <Test />;
			a.dom.appendChild(el);
			a.dom.removeChild(el);
			a.dom.appendChild(el);
		});
	});

	a.test('update', it => {
		it.should('emit on connect and when an attribute changes', a => {
			const id = `cxl-test${a.id}`;
			const done = a.async();
			let i = 0;

			@Augment(
				update($ => {
					a.equal($.tagName, id.toUpperCase());
					if (i++ === 1) done();
				})
			)
			class Test extends Component {
				static tagName = id;
				@Attribute()
				hello = 'world';
			}
			const el = (<Test />) as Test;
			a.dom.appendChild(el);
			el.hello = 'hello';
		});
	});

	a.test('attributeChanged', it => {
		it.should('fire synchronously', a => {
			const id = `cxl-test${a.id}`;
			@Augment<Test>(id, $ =>
				$.bind(
					attributeChanged($, 'test').tap(() => {
						throw 'Should not fire';
					})
				)
			)
			class Test extends Component {
				@Attribute()
				test = '';
			}

			const test = (<Test test={of('hello')} />) as Test;
			a.dom.appendChild(test);
			a.equal(test.test, 'hello');
		});
	});

	a.test('getRegisteredComponents', it => {
		it.should('return registered components', a => {
			const components = getRegisteredComponents();
			a.ok(components);
			a.ok(components['cxl-span']);
		});
	});
});
