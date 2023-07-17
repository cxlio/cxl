import { dom } from '@cxl/tsx';
import { suite, triggerKeydown } from '@cxl/spec';
import {
	animationFrame,
	empty,
	getShadow,
	findNextNode,
	findNextNodeBySelector,
	insert,
	on,
	onAction,
	onAttributeChange,
	onChildrenMutation,
	onKeypress,
	onHashChange,
	onHistoryChange,
	onLoad,
	onReady,
	setAttribute,
	trigger,
} from './index.js';

export default suite('dom', test => {
	test('empty(Element)', a => {
		const el = (
			<div>
				content
				<span />
			</div>
		) as Element;

		a.equal(el.childNodes.length, 2);
		empty(el);
		a.equal(el.childNodes.length, 0);
	});

	test('setAttribute(Element, string, any)', a => {
		const el = (<div />) as Element;

		setAttribute(el, 'test-attribute', 'value');
		a.equal(el.getAttribute('test-attribute'), 'value');

		setAttribute(el, 'test-attribute', null);
		a.equal(el.hasAttribute('test-attribute'), false);

		setAttribute(el, 'test-attribute', 'world');
		a.equal(el.getAttribute('test-attribute'), 'world');

		setAttribute(el, 'test-attribute', false);
		a.equal(el.hasAttribute('test-attribute'), false);
	});

	test('on', it => {
		it.should('add event listeners to native elements', a => {
			const done = a.async();
			const el = (<div />) as HTMLDivElement;
			on(el, 'click')
				.first()
				.subscribe(ev => {
					a.equal(ev.type, 'click');
					a.equal(ev.target, el);
					done();
				});
			el.click();
		});
	});

	test('onKeypress', it => {
		it.should('emit events when a key is pressed', a => {
			const done = a.async();
			const el = (<button />) as HTMLButtonElement;
			onKeypress(el, 'w')
				.first()
				.subscribe(ev => {
					a.equal(ev.target, el);
					done();
				});
			triggerKeydown(el, 'w');
		});
	});

	test('onAction', it => {
		it.should('add event listeners to dom elements', a => {
			const done = a.async();
			const el = (<div />) as HTMLDivElement;
			onAction(el)
				.first()
				.subscribe(ev => {
					a.equal(ev.type, 'click');
					a.equal(ev.target, el);
					done();
				});
			el.click();
		});
	});

	test('onReady', it => {
		it.should('emit if page readyState is interactive', a => {
			const done = a.async();
			onReady()
				.first()
				.subscribe(ev => {
					a.ok(ev);
					done();
				});
		});
	});

	test('onLoad', it => {
		it.should('emit on page load', a => {
			const done = a.async();
			onLoad()
				.first()
				.subscribe(ev => {
					a.ok(ev);
					done();
				});
		});
	});

	test('getShadow', it => {
		it.should('attach shadow dom if not already present', a => {
			const el = (<div />) as HTMLDivElement;
			const shadow = getShadow(el);
			a.equal(el.shadowRoot, shadow);
		});
		it.should('return existing shadom root if present', a => {
			const el = (<div />) as HTMLDivElement;
			el.attachShadow({ mode: 'open' });
			const shadow = getShadow(el);
			a.equal(el.shadowRoot, shadow);
		});
	});

	test('trigger', it => {
		it.should('trigger custom events', a => {
			const done = a.async();
			const el = (<div />) as HTMLDivElement;
			on(el, 'click')
				.first()
				.subscribe(ev => {
					a.equal(ev.type, 'click');
					a.equal(ev.target, el);
					a.equal(ev.detail, a.id);
					done();
				});

			trigger(el, 'click', { detail: a.id });
		});
	});

	test('onAttributeChange', it => {
		it.should('trigger when an attribute value changes', a => {
			const done = a.async();
			const el = (<div />) as HTMLDivElement;
			onAttributeChange(el)
				.first()
				.subscribe({
					next() {
						a.equal(el.getAttribute('title'), 'test');
					},
					complete() {
						setTimeout(() => {
							onAttributeChange(el)
								.first()
								.subscribe(() => {
									a.equal(el.hasAttribute('title'), false);
									done();
								});
							el.removeAttribute('title');
						});
					},
				});
			el.setAttribute('title', 'test');
		});

		it.should('handle value attribute changes', a => {
			const done = a.async();
			const el = (<input />) as HTMLInputElement;
			onAttributeChange(el)
				.first()
				.subscribe(() => {
					a.equal(el.value, 'test');
					done();
				});
			el.setAttribute('value', 'test');
			trigger(el, 'change');
		});
	});

	test('onChildrenMutation', it => {
		it.should('trigger when a child is inserted or removed', a => {
			const done = a.async();
			const el = (<div />) as HTMLDivElement;
			onChildrenMutation(el)
				.first()
				.subscribe({
					next() {
						a.equal(el.children.length, 1);
					},
					complete() {
						setTimeout(() => {
							onChildrenMutation(el)
								.take(2)
								.subscribe(() => {
									if (el.children.length === 0) done();
								});
							el.removeChild(el.children[0]);
						});
					},
				});
			el.appendChild(<div />);
		});
	});

	test('onHashChange', it => {
		it.should('emit when subscribed', a => {
			const done = a.async();
			onHashChange()
				.first()
				.subscribe(hash => {
					a.equal(hash, '');
					done();
				});
		});
		it.should('emit when hashchange event is triggered', a => {
			const done = a.async();
			let i = 0;
			onHashChange()
				.take(2)
				.subscribe(hash => {
					a.equal(hash, '');
					if (i++ == 1) done();
				});
			trigger(window, 'hashchange');
		});
	});

	test('onHistoryChange', it => {
		it.should('emit when a new history state is pushed', a => {
			const done = a.async();
			const newState = { test: a.id };
			onHistoryChange()
				.take(2)
				.subscribe(state => {
					if (state) {
						a.equal(state.test, newState.test);
						done();
					}
				});

			history.pushState(newState, '');
		});
	});

	test('animationFrame', it => {
		it.should('trigger on animation frame', a => {
			const done = a.async();
			const subs = animationFrame.subscribe(frame => {
				if (frame === 1) {
					subs.unsubscribe();
					done();
				} else a.equal(frame, 0);
			});
		});
	});

	test('insert', it => {
		it.should('insert a text node if a string is passed', a => {
			const el = (<div />) as HTMLDivElement;
			insert(el, 'test');
			a.equal(el.textContent, 'test');
		});
	});

	test('findNextNode', it => {
		it.should('find next node', a => {
			const el = (
				<ul>
					<li>One</li>
					<li>Two</li>
					<li>Three</li>
					<li>Four</li>
				</ul>
			) as HTMLElement;
			const two = findNextNode(
				el.children[0],
				child => child.textContent === 'Three'
			);
			a.equal(two, el.children[2]);
		});
	});

	test('findNextNodeBySelector', it => {
		it.should('find next node by css selector', a => {
			const el = (
				<ul>
					<li>One</li>
					<li>Two</li>
					<li className="three">Three</li>
					<li>Four</li>
				</ul>
			) as HTMLElement;
			const two = findNextNodeBySelector(el, el.children[0], '.three');
			a.equal(two, null);
			const four = findNextNodeBySelector(el, el.children[2], 'li');
			a.equal(four, el.children[3]);
		});
	});
});
