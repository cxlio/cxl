import { suite } from '../tester';
import { Bind, Component, Template, createComponent } from './index';
import { of, tap } from '../rx';
import { setContent, onAction, dom } from '../template';

export default suite('component', test => {
	test('@Component - empty', a => {
		@Component()
		class TestComponent {}

		const instance = createComponent(TestComponent);
		a.ok(instance);
	});

	test('@Template', a => {
		@Component()
		@Template(({ state }) => {
			a.equal(state.text, 'hello');
			return (
				<div
					$={el =>
						of(state.text).pipe(
							tap(text => a.equal(text, 'hello')),
							setContent(el)
						)
					}
				/>
			);
		})
		class TestComponent {
			text = 'hello';
		}

		createComponent(TestComponent)
			.subscribe(el => {
				a.ok(el);
				a.ok(el.shadowRoot);
				a.ok(el.shadowRoot?.childNodes);
				a.equal(el.shadowRoot?.childNodes.length, 1);
				a.equal(
					el.shadowRoot?.childNodes[0].childNodes[0].textContent,
					'hello'
				);
			})
			.unsubscribe();
	});

	test('@Bind', a => {
		@Component()
		@Bind<TestComponent>(({ state, element }) => {
			a.equal(state.text, 'hello');
			a.ok(element);
			return of(state.text).pipe(
				tap(text => a.equal(text, 'hello')),
				setContent(element)
			);
		})
		class TestComponent {
			text = 'hello';
		}

		createComponent(TestComponent)
			.subscribe(el => a.equal(el.childNodes[0].textContent, 'hello'))
			.unsubscribe();
	});

	test('@Template - Bind to host element', a => {
		@Component('cxl-radio2')
		@Bind<RadioButton>(({ element, state, select }) => [
			onAction(element).pipe(tap(() => state.toggle())),
			select('value').pipe(tap(() => state.onValue())),
			select('name').pipe(tap(() => state.toggle()))
		])
		@Template(() => {
			return (
				<x>
					<x className="focusCircle focusCirclePrimary"></x>
					<x className="box">
						<x className="circle"></x>
					</x>
					<slot className="content"></slot>
				</x>
			);
		})
		class RadioButton {
			name = '';
			value = '';

			toggle() {}
			onValue() {}
		}

		createComponent(RadioButton)
			.subscribe(el => {
				a.ok(el);
				a.equal(el.tagName, 'CXL-RADIO2');
			})
			.unsubscribe();
	});

	test('@Template - Bind to host element', a => {
		@Component('cxl-radio1')
		@Bind<RadioButton>(({ state, element, select }) => [
			onAction(element).pipe(tap(() => state.toggle())),
			select('value').pipe(tap(val => state.onValue(val))),
			select('name').pipe(tap(() => state.toggle()))
		])
		@Template(() => {
			return (
				<x>
					<x className="focusCircle focusCirclePrimary"></x>
					<x className="box">
						<x className="circle"></x>
					</x>
					<slot className="content"></slot>
				</x>
			);
		})
		class RadioButton {
			name = '';
			value = 'test';
			visible = false;

			toggle() {
				this.visible = true;
			}
			onValue(val: string) {
				a.equal(val, 'test');
			}
		}

		createComponent(RadioButton)
			.subscribe(el => {
				a.ok(el);
				a.equal(el.tagName, 'CXL-RADIO1');
			})
			.unsubscribe();
	});
});
