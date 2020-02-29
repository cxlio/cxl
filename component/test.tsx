/// <amd-module name="index" />
import { suite } from '../tester';
import {
	Attribute,
	Augment,
	Component,
	Slot,
	bind,
	getAttribute,
	register,
	template
} from './index';
import { dom, render, connectUntil } from '../xdom';
import { of, tap } from '../rx';

export default suite('component', test => {
	test('Component - empty', a => {
		class TestComponent extends Component {
			static tagName = 'div';
		}
		const jsx = dom(TestComponent);
		a.ok(jsx);
		const element = render(jsx).element;
		a.ok(element);
		a.ok(element instanceof HTMLDivElement);
	});

	test('Component - register', a => {
		const id = 'cxl-test' + a.id;
		@Augment(register(id))
		class Test extends Component {}
		const el = render(dom(Test));
		a.ok(el);
	});

	test('Component - template', a => {
		const id = 'cxl-test' + a.id;
		@Augment(
			register(id),
			template(
				<div>
					<slot></slot>
				</div>
			)
		)
		class Test extends Component {}

		const tpl = <Test>Hello World</Test>;
		const el = tpl() as HTMLDivElement;
		const el2 = tpl() as HTMLDivElement;

		a.ok(el);
		a.ok(el.shadowRoot);
		a.equal(el.shadowRoot?.childNodes.length, 1);
		a.equal(el.shadowRoot?.children[0].tagName, 'DIV');
		a.equal(el.childNodes.length, 1);
		a.ok(el2);
		a.ok(el2.shadowRoot);
		a.equal(el2.shadowRoot?.childNodes.length, 1);
		a.equal(el2.shadowRoot?.children[0].tagName, 'DIV');
		a.equal(el2.childNodes.length, 1);
	});

	test('Slot', a => {
		const el = render(<Slot selector="slot-name"></Slot>).element;

		a.ok(el);
		a.ok(el instanceof HTMLSlotElement);
	});

	test('bind', a => {
		const id = 'cxl-test' + a.id;
		function bindTest(node: Test) {
			a.equal(node.tagName, id.toUpperCase());
			return of('hello').pipe(tap(val => (node.title = val)));
		}

		@Augment(register(id), bind(bindTest))
		class Test extends Component {}

		const el = (<Test></Test>)() as Test;
		a.dom.appendChild(el);
		a.equal(el.title, 'hello');
		a.ran(2);
	});

	/*test('compose', a => {
		const id = 'cxl-test' + a.id;
		function Focusable(Parent: any) {
			class Focusable extends Parent {
				@Attribute()
				disabled = false;
				name = 'hello';
			}
			return Focusable;
		}

		function Touchable(Parent: any) {
			return class Touchable extends Parent {
				touched = true;
			};
		}

		const Test = component(id, compose(Focusable, Touchable));
		const instance: typeof Test = <Test></Test>;

		a.ok(Test);
		a.ok(instance.touched);
		a.equal(instance.name, 'hello');
		a.ok(Focusable);
	});*/

	test('Component - inheritance', a => {
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

		@Augment(register(id))
		class Input extends InputBase {
			@Attribute()
			maxlength = -1;

			focus() {}
		}

		const instance = render<Input>(<Input maxlength={10}></Input>).element;

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

	test('Attribute', a => {
		const id = 'cxl-test' + a.id;

		@Augment(register(id))
		class TestComponent extends Component {
			@Attribute()
			test = true;
		}

		connectUntil<TestComponent>(<TestComponent></TestComponent>, el => {
			a.equal(el.test, true);
			el.test = false;
			a.equal(el.test, false);
		});

		connectUntil<TestComponent>(
			<TestComponent test={false}></TestComponent>,
			el => {
				a.equal(el.test, false);
				el.test = true;
				a.equal(el.test, true);
			}
		);
	});

	test('Component - Attributes', a => {
		const id = 'cxl-test' + a.id;

		class Test extends Component {
			@Attribute()
			hello = 'world';
		}

		register(id)(Test);

		a.ok(Test.observedAttributes.includes('hello'));

		connectUntil<Test>(<Test hello="hello"></Test>, el => {
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
	});

	/*
	test('Bindings - Events', a => {
		const el = render(
			<Div
				$={el => on(el, 'blur').pipe(tap(ev => (el.title = ev.type)))}
			/>
		);

		a.ok(el);
		a.dom.appendChild(el);
		trigger(el, 'blur');
		a.equal(el.title, 'blur');
	});

	test('Bindings - Children', a => {
		const el = render(
			<Div>
				<Div
					$={el =>
						on(el, 'blur').pipe(tap(ev => (el.title = ev.type)))
					}
				/>
			</Div>
		);
		a.ok(el);
		const child = el.children[0] as Div;
		a.ok(child);
		a.dom.appendChild(el);
		trigger(child, 'blur');
		a.equal(child.title, 'blur');
	});

	test('Bindings - Attribute', a => {
		const [checked, setChecked] = hook(true);

		const el = render(
			<Div
				className={checked.pipe(map(val => (val ? 'minus' : 'check')))}
				tabIndex={10}
			/>
		);

		a.ok(el);
		a.equal(el.tabIndex, 10);
		a.dom.appendChild(el);
		a.equal(el.className, 'minus');
		setChecked(false);
		a.equal(el.className, 'check');
	});
	*/

	test('Component - Attributes', a => {
		const id = 'cxl-test' + a.id;

		@Augment(register(id))
		class Test extends Component {
			@Attribute()
			hello = 'world';
		}

		a.ok(Test.observedAttributes.includes('hello'));

		connectUntil<Test>(<Test hello="hello"></Test>, el => {
			a.ok(el);
			a.equal(el.tagName, id.toUpperCase());
			a.equal(el.hello, 'hello');

			el.hello = 'hello';
			a.equal(el.hello, 'hello');
			const el3 = document.createElement(id) as Test;
			a.equal(el.hello, 'hello');
			a.equal(el3.hello, 'world');
		});
	});

	/*
	test('Component - composition', a => {
		const id = 'cxl-test' + a.id;

		class Touchable {
			touched = true;
		}

		class Focusable {
			@Attribute()
			disabled = false;
			name = 'hello';
		}

		@Augment(register(id))
		class Test extends mixin(Touchable, Focusable) {
			name = 'newname';
		}

		const el = render<Test>(<Test />);
		a.ok(el);
		a.equal(el.touched, true);
		a.equal(el.disabled, false);
		a.equal(el.name, 'newname');
	});

	test('Component - Template', a => {
		const id = 'cxl-test' + a.id;

		@Augment(register(id), <Div title="Custom Component"></Div>)
		class Test extends Component {}

		const el = render<Test>(<Test />);
		a.dom.appendChild(el);
		a.ok(el);
		a.ok(el.shadowRoot);
		a.equal(
			el.shadowRoot?.children[0].getAttribute('title'),
			'Custom Component'
		);
	});
	test('dom - empty', a => {
		const div = dom(Div);
		a.equal(div.Component, Div);
		a.ok(div.render() instanceof Div);
	});
	*/

	test('getAttribute', a => {
		const id = 'cxl-test' + a.id;

		@Augment(register(id))
		class Test extends Component {
			@Attribute()
			hello = 'world';
		}

		a.ok(Test.observedAttributes.includes('hello'));

		connectUntil<Test>(<Test hello="hello"></Test>, el => {
			let lastValue = 'hello';
			a.equal(el.hello, 'hello');
			const subs = getAttribute(el, 'hello')
				.pipe(
					tap(val => {
						a.equal(val, lastValue);
					})
				)
				.subscribe();

			el.hello = lastValue = 'test';

			subs.unsubscribe();
		});

		a.ran(4);
	});
});
