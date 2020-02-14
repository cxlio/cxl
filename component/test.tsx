/// <amd-module name="index" />
import { suite } from '../tester';
import { compose, component, Register, Component, Attribute } from './index';
import { dom } from '../xdom';

// import { of, tap } from '../rx';
// import { setContent, onAction, dom } from '../template';

export default suite('component', test => {
	test('Component - empty', a => {
		class TestComponent extends Component {}
		const instance = dom(TestComponent);
		a.ok(instance);
	});

	test('compose', a => {
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
	});

	test('Slot', a => {
		const el = render<Slot>(<Slot selector="slot-name"></Slot>);

		a.ok(el);
		a.ok(el instanceof Slot);
	});
	test('Component - complex', a => {
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
			maxLength = -1;

			focus() {}
		}

		const instance = render<Input>(<Input maxLength={10}></Input>);

		a.ok(instance);
		a.ok(Input.observedAttributes);
		a.ok(Input.observedAttributes.includes('invalid'));
		a.equal(instance.tagName, id.toUpperCase());
		a.equal(instance.invalid, false);
		a.equal(instance.maxLength, 10);
		a.equal(instance.name, '');
	});

	test('Attribute', a => {
		const id = 'cxl-test' + a.id;

		@Augment(register(id))
		class TestComponent extends Component {
			@Attribute()
			test = true;
		}

		const el = render<TestComponent>(<TestComponent></TestComponent>);
		a.equal(el.test, true);
		// a.ok(el.hasAttribute('test'));
	});
	test('Component - Attributes', a => {
		const id = 'cxl-test' + a.id;

		class Test extends Component {
			@Attribute()
			hello = 'world';
		}

		register(id)(Test);

		a.ok(Test.observedAttributes.includes('hello'));

		const el = render<Test>(<Test hello="hello"></Test>);
		a.dom.appendChild(el);
		a.ok(el);
		a.equal(el.tagName, id.toUpperCase());
		a.equal(el.hello, 'hello');

		el.hello = 'hello';
		a.equal(el.hello, 'hello');
		a.equal(el.getAttribute('hello'), 'hello');
		const el3 = document.createElement(id) as Test;
		a.equal(el.hello, 'hello');
		a.equal(el3.hello, 'world');
	});

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

	test('Component - Attributes', a => {
		const id = 'cxl-test' + a.id;

		@Augment(register(id))
		class Test extends Component {
			@Attribute()
			hello = 'world';
		}

		a.ok(Test.observedAttributes.includes('hello'));

		const el = render<Test>(<Test hello="hello"></Test>);
		a.ok(el);
		a.equal(el.tagName, id.toUpperCase());
		a.equal(el.hello, 'hello');

		el.hello = 'hello';
		a.equal(el.hello, 'hello');
		const el3 = document.createElement(id) as Test;
		a.equal(el.hello, 'hello');
		a.equal(el3.hello, 'world');
	});

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
});
