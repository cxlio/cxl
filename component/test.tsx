import { suite } from '../spec/index.js';
import {
	Attribute,
	StyleAttribute,
	Augment,
	Component,
	Slot,
	get,
	bind,
	registerComponent
} from './index';
import { dom, render, connect } from '../xdom';
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
		@Augment()
		class Test extends Component {
			static tagName = id;
		}
		const el = render(dom(Test));
		a.ok(el);
	});

	test('Component - template', a => {
		const id = 'cxl-test' + a.id;
		@Augment(
			<div>
				<slot></slot>
			</div>
		)
		class Test extends Component {
			static tagName = id;
		}

		const tpl = <Test>Hello World</Test>;
		const el = render(tpl).element as HTMLDivElement;
		const el2 = render(tpl).element as HTMLDivElement;

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

		@Augment(bind(bindTest))
		class Test extends Component {
			static tagName = id;
		}

		const el = render(<Test></Test>).element as Test;
		a.dom.appendChild(el);
		a.equal(el.title, 'hello');
		a.ran(2);
	});

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

		@Augment()
		class Input extends InputBase {
			static tagName = id;

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

		@Augment()
		class TestComponent extends Component {
			static tagName = id;

			@Attribute()
			test = true;
		}

		connect<TestComponent>(<TestComponent></TestComponent>, el => {
			a.equal(el.test, true);
			el.test = false;
			a.equal(el.test, false);
		});

		connect<TestComponent>(
			<TestComponent test={false}></TestComponent>,
			el => {
				a.equal(el.test, false);
				el.test = true;
				a.equal(el.test, true);
			}
		);
	});

	test('Attribute - multi word', a => {
		const id = 'cxl-test' + a.id;

		@Augment()
		class TestComponent extends Component {
			static tagName = id;
			@Attribute()
			'test-boolean' = false;
			@Attribute()
			'test-string' = 'string';
		}

		connect<TestComponent>(<TestComponent test-boolean={true} />, el => {
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
	});

	test('Component - Attributes', a => {
		const id = 'cxl-test' + a.id;

		class Test extends Component {
			@Attribute()
			hello = 'world';
		}

		registerComponent(id, Test);

		a.ok(Test.observedAttributes.includes('hello'));

		connect<Test>(<Test hello="hello"></Test>, el => {
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

	test('Component - Attributes', a => {
		const id = 'cxl-test' + a.id;

		@Augment()
		class Test extends Component {
			static tagName = id;

			@Attribute()
			hello = 'world';
		}

		a.ok(Test.observedAttributes.includes('hello'));

		connect<Test>(<Test hello="hello"></Test>, el => {
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

	test('StyleAttribute - default', a => {
		const id = 'cxl-test' + a.id;

		@Augment()
		class Test extends Component {
			static tagName = id;

			@StyleAttribute()
			persist = true;
		}

		connect<Test>(<Test />, el => {
			a.equal(el.persist, true);
			a.dom.appendChild(el);
			a.ok(el.hasAttribute('persist'));
		});
	});

	test('get', a => {
		const id = 'cxl-test' + a.id;

		@Augment()
		class Test extends Component {
			static tagName = id;

			@Attribute()
			hello = 'world';
		}

		a.ok(Test.observedAttributes.includes('hello'));

		connect<Test>(<Test hello="hello"></Test>, el => {
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
		});

		a.ran(4);
	});
});
