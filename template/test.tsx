import { ListEvent, be, ref, of, merge } from '@cxl/rx';
import { dom } from '@cxl/tsx';
import { Attribute, Augment, Component, Span } from '@cxl/component';
import { suite, triggerKeydown } from '@cxl/spec';
import { animationFrame, trigger } from '@cxl/dom';
import {
	CheckedComponent,
	FocusableComponent,
	aria,
	ariaValue,
	ariaChecked,
	checkedBehavior,
	focusable,
	role,
	each,
	getAttribute,
	navigationList,
	staticTemplate,
	list,
	portal,
	teleport,
	model,
	registable,
	registableHost,
	render,
	selectable,
	selectableHost,
	selectableHostMultiple,
	sortBy,
	syncAttribute,
} from './index.js';

declare module '@cxl/template' {
	interface RegistableMap {
		test: Component;
	}
}

async function connect<T extends Node>(
	el: T,
	callback: (el: T) => void | Promise<void>
) {
	await callback(el);
}

export default suite('template', test => {
	test('bindings - get', a => {
		const done = a.async();
		const value = be('');
		let first = true;

		function onTitle(val: string) {
			if (first) {
				a.equal(val, 'test');
				first = false;
			} else {
				a.equal(val, 'title');
				value.next('value');
			}
		}

		function onValue(val: string) {
			if (val) {
				a.equal(val, 'value');
				done();
			}
		}

		connect(
			(
				<Span
					title="test"
					$={el =>
						merge(
							getAttribute(el, 'title').tap(onTitle),
							value.tap(onValue)
						)
					}
				/>
			) as HTMLElement,
			el => {
				a.dom.appendChild(el);
				a.ok(!first);
				el.title = 'title';
			}
		);
	});

	test('getAttribute - native', a => {
		const done = a.async();
		const el = document.createElement('div');
		const obs = getAttribute(el, 'title').tap(value => {
			el.setAttribute('aria-disabled', value ? 'true' : 'false');
			if (value) el.removeAttribute('tabindex');
			else el.tabIndex = 0;

			if (value === 'true') {
				subs.unsubscribe();
				done();
			}
		});
		const subs = obs.subscribe();
		a.equal(el.getAttribute('aria-disabled'), 'false');
		a.equal(el.tabIndex, 0);
		el.setAttribute('title', 'true');
	});

	test('portal', async a => {
		const id = 'cxl-test' + a.id;

		await connect(<Span $={portal(id)} />, async el => {
			const subs = teleport(
				(<span>Hello</span>) as HTMLSpanElement,
				id
			).subscribe();
			await animationFrame.first();
			a.ok(el);
			a.equal(el.childNodes.length, 1);
			a.equal(el.childNodes[0]?.textContent, 'Hello');
			subs.unsubscribe();
		});
	});

	test('model', async a => {
		const el = a.element('input');
		const sub = be('');

		const subs = model(el, sub).subscribe();

		a.equal(el.value, '');
		a.equal(el.value, sub.value);
		el.value = 'test';
		trigger(el, 'change');
		await animationFrame.first();
		a.equal(sub.value, 'test');
		a.equal(el.value, sub.value);

		subs.unsubscribe();
	});

	test('navigationList', it => {
		it.should('navigate by keyup and keydown', a => {
			a.dom.innerHTML = `<ul><li>One</li><li>Two</li><li>Three</li></ul>`;
			const done = a.async();
			const ul = a.dom.firstElementChild as HTMLUListElement;
			let eventIndex = 0;
			let lastEl: Element;
			const subs = navigationList(ul, 'li', 'li.selected').subscribe(
				el => {
					if (eventIndex === 0) a.equal(el, ul.firstElementChild);
					else if (eventIndex === 1) a.equal(el, ul.children[1]);
					else if (eventIndex === 2) a.equal(el, ul.children[2]);
					else if (eventIndex === 3) a.equal(el, ul.children[2]);
					else if (eventIndex === 4) a.equal(el, ul.children[1]);
					else if (eventIndex === 5) a.equal(el, ul.children[0]);
					else if (eventIndex === 6) a.equal(el, ul.children[0]);
					else {
						subs.unsubscribe();
						done();
					}
					if (lastEl) lastEl.className = '';
					if (el) {
						el.className = 'selected';
						lastEl = el;
					}
					eventIndex++;
				}
			);

			triggerKeydown(ul, 'ArrowDown');
			triggerKeydown(ul, 'ArrowDown');
			triggerKeydown(ul, 'ArrowDown');
			triggerKeydown(ul, 'ArrowDown');
			triggerKeydown(ul, 'ArrowUp');
			triggerKeydown(ul, 'ArrowUp');
			triggerKeydown(ul, 'ArrowUp');
			triggerKeydown(ul, 'ArrowUp');
		});

		it.should('select first element on keydown', a => {
			a.dom.innerHTML = `<ul><li disabled>One</li><li>Two</li><li>Three</li></ul>`;
			const done = a.async();
			const ul = a.dom.firstElementChild as HTMLUListElement;
			const subs = navigationList(
				ul,
				'li:not([disabled])',
				'li.selected'
			).subscribe(el => {
				a.equal(el, ul.children[1]);
				subs.unsubscribe();
				done();
			});
			triggerKeydown(ul, 'ArrowDown');
		});

		it.should('select last element on keyup that matches selector', a => {
			a.dom.innerHTML = `<ul><li>One</li><li>Two</li><li disabled>Three</li></ul>`;
			const done = a.async();
			const ul = a.dom.firstElementChild as HTMLUListElement;
			const subs = navigationList(
				ul,
				'li:not([disabled])',
				'li.selected'
			).subscribe(el => {
				a.equal(el, ul.children[1]);
				subs.unsubscribe();
				done();
			});
			triggerKeydown(ul, 'ArrowUp');
		});

		it.should('select last element on keyup', a => {
			a.dom.innerHTML = `<ul><li>One</li><li>Two</li><li>Three</li></ul>`;
			const done = a.async();
			const ul = a.dom.firstElementChild as HTMLUListElement;
			const subs = navigationList(ul, 'li', 'li.selected').subscribe(
				el => {
					a.equal(el, ul.children[2]);
					subs.unsubscribe();
					done();
				}
			);
			triggerKeydown(ul, 'ArrowUp');
		});

		it.should('select by character key', a => {
			a.dom.innerHTML = `<ul><li>One</li><li>Two</li><li disabled>Three</li><li>tour</li></ul>`;
			const done = a.async();
			const ul = a.dom.firstElementChild as HTMLUListElement;
			let eventIndex = 0;
			let lastEl: Element;
			const subs = navigationList(
				ul,
				'li:not([disabled])',
				'li.selected'
			).subscribe(el => {
				if (eventIndex === 0) a.equal(el, ul.children[1]);
				else if (eventIndex === 1) a.equal(el, ul.children[3]);
				else if (eventIndex === 2) a.equal(el, ul.children[1]);
				else {
					a.equal(el, ul.children[3]);
					subs.unsubscribe();
					done();
				}
				if (lastEl) lastEl.className = '';
				if (el) {
					el.className = 'selected';
					lastEl = el;
				}
				eventIndex++;
			});
			triggerKeydown(ul, 't');
			triggerKeydown(ul, 't');
			triggerKeydown(ul, 't');
			triggerKeydown(ul, 't');
		});
	});

	test('sortBy', it => {
		it.should('work with Array.sort', a => {
			const A = [{ id: 3 }, { id: 2 }, { id: 1 }];
			A.sort(sortBy('id'));
			a.equal(A[0].id, 1);
			a.equal(A[1].id, 2);
			a.equal(A[2].id, 3);
		});
	});

	/*test('triggerEvent', it => {
		it.should('trigger custom event', a => {
			const done = a.async();
			const sub = of('test');
			const el = (<div />) as HTMLDivElement;

			on(el, 'custom')
				.first()
				.subscribe(ev => {
					a.equal(ev.target, el);
					a.equal(ev.detail, 'test');
					done();
				});

			sub.pipe(triggerEvent(el, 'custom')).subscribe();
		});
	});*/

	test('each', it => {
		it.should('render each element in an array', a => {
			const span = (
				<Span>
					{each(of([1, 2, 3]), n => (
						<p>{n}</p>
					))}
				</Span>
			) as Span;
			a.dom.appendChild(span);
			a.equal(span.children.length, 3);
		});
		it.should('handle empty arrays', a => {
			const span = (
				<Span>
					{each(of([]), n => (
						<p>{n}</p>
					))}
				</Span>
			) as Span;
			a.dom.appendChild(span);
			a.equal(span.children.length, 0);
		});
		it.should('render empty element if array is empty', a => {
			const span = (
				<Span>
					{each(
						of([]),
						n => (
							<p>{n}</p>
						),
						() => (
							<p>Empty</p>
						)
					)}
				</Span>
			) as Span;
			a.dom.appendChild(span);
			a.equal(span.children.length, 1);
			a.equal(span.children[0].textContent, 'Empty');
		});
	});

	/*test('stopEvent', it => {
		it.should('stop event propagation', a => {
			const div = (
				<div>
					<span></span>
				</div>
			) as HTMLDivElement;
			const span = div.children[0];
			const done = a.async();
			let i = 0;

			on(div, 'change')
				.first()
				.subscribe(ev => {
					a.equal(i, 1);
					a.equal(ev.target, span);
					done();
				});

			on(span, 'change')
				.first()
				.pipe(stopEvent())
				.subscribe(() => {
					i++;
				});

			trigger(span, 'change', { bubbles: true });
			trigger(span, 'change', { bubbles: true });
		});
	});*/

	test('syncAttribute', it => {
		it.should('sync an attribute between two elements', a => {
			const A = (<input />) as HTMLInputElement;
			const B = (<button />) as HTMLButtonElement;
			const done = a.async();
			let i = 0;

			const subs = syncAttribute(A, B, 'value').subscribe(() => {
				if (i++ === 0) {
					a.equal(B.value, 'test');
					B.setAttribute('value', 'test2');
				} else {
					a.equal(B.value, 'test2');
					subs.unsubscribe();
					done();
				}
			});
			A.setAttribute('value', 'test');
		});
	});

	test('render', it => {
		it.should('render elements based on observable value', a => {
			const A = (
				<Span>
					{render(of(1), n => (
						<p>{n}</p>
					))}
				</Span>
			) as Span;
			a.dom.appendChild(A);
			a.equal(A.children.length, 1);
			a.equal(A.textContent, '1');
		});

		it.should('display a loading element until observable emits', a => {
			const O = ref<string>();
			const A = (
				<Span>
					{render(
						O,
						n => (
							<p>{n}</p>
						),
						() => (
							<p>Loading</p>
						)
					)}
				</Span>
			) as Span;
			a.dom.appendChild(A);
			a.equal(A.textContent, 'Loading');
			O.next('Hello');
			a.equal(A.children.length, 1);
			a.equal(A.textContent, 'Hello');
		});
	});

	test('list', it => {
		it.should('render elements based on observable emitted values', a => {
			const source = be<ListEvent<string, string>>({ type: 'empty' });
			const A = (
				<Span>
					{list(source, item => (
						<p>{item}</p>
					))}
				</Span>
			) as Span;
			a.dom.appendChild(A);
			a.equal(A.children.length, 0);
			source.next({ type: 'insert', item: 'first', key: '1' });
			a.equal(A.children.length, 1);
			source.next({ type: 'insert', item: 'second', key: '2' });
			a.equal(A.children.length, 2);
			source.next({ type: 'remove', key: '1' });
			a.equal(A.children.length, 1);
			a.equal(A.textContent, 'second');
		});
	});

	test('aria', it => {
		it.should(
			'set initial aria attribute value when element is connected',
			a => {
				const A = (<Span $={aria('checked', 'yes')} />) as Span;
				a.dom.appendChild(A);
				a.equal(A.getAttribute('aria-checked'), 'yes');
			}
		);
	});

	test('ariaValue', it => {
		it.should(
			'set initial aria attribute value when element is connected',
			a => {
				const A = (
					<Span $={el => of('test').pipe(ariaValue(el, 'label'))} />
				) as Span;
				a.dom.appendChild(A);
				a.equal(A.getAttribute('aria-label'), 'test');
			}
		);
	});

	test('ariaValue', it => {
		it.should(
			'set initial aria attribute value when element is connected',
			a => {
				const A = (
					<Span $={el => of('test').pipe(ariaValue(el, 'label'))} />
				) as Span;
				a.dom.appendChild(A);
				a.equal(A.getAttribute('aria-label'), 'test');
			}
		);
	});

	test('ariaChecked', it => {
		it.should(
			'set initial aria attribute value when element is connected',
			a => {
				const checked = be<boolean | undefined>(undefined);
				const A = (
					<Span $={el => checked.pipe(ariaChecked(el))} />
				) as Span;
				a.dom.appendChild(A);
				a.equal(A.getAttribute('aria-checked'), 'mixed');
				checked.next(true);
				a.equal(A.getAttribute('aria-checked'), 'true');
				checked.next(false);
				a.equal(A.getAttribute('aria-checked'), 'false');
			}
		);
	});

	test('role', it => {
		it.should(
			'set initial aria role attribute value when element is connected',
			a => {
				const A = (<Span $={role('button')} />) as Span;
				a.dom.appendChild(A);
				a.equal(A.getAttribute('role'), 'button');
			}
		);
	});

	test('focusable', it => {
		@Augment(`cxl-test${it.id}`)
		class F extends Component implements FocusableComponent {
			disabled = false;
			touched = false;
		}

		it.should('make components focusable', a => {
			const A = (<F $={focusable} />) as F;
			const B = (<F $={focusable} />) as F;
			a.dom.appendChild(A);
			a.dom.appendChild(B);
			A.focus();
			a.ok(A.matches(':focus'));
			B.focus();
			a.ok(A.touched);
			a.ok(!B.touched);
			a.ok(!A.matches(':focus'));
			a.ok(B.matches(':focus'));
		});

		it.should('handle disabled attribute', a => {
			const A = (<F $={focusable} />) as F;
			a.dom.appendChild(A);
			A.focus();
			a.ok(A.matches(':focus'));
			A.attributes$.next({
				target: A,
				attribute: 'disabled',
				value: true,
			});
			a.ok(!A.matches(':focus'));
			a.equal(A.getAttribute('aria-disabled'), 'true');
		});
	});

	test('registable', it => {
		it.should('send a register event when connected', a => {
			const elements = new Set<Span>();
			const A = (
				<Span $={el => registableHost('test', el, elements)} />
			) as Span;
			const B = (<Span $={el => registable('test', el)} />) as Span;
			a.dom.appendChild(A);
			A.appendChild(B);
			a.equal(elements.size, 1);
			a.equal(elements.has(B), true);
		});
	});

	test('checkedBehavior', it => {
		@Augment(`cxl-test${it.id}`)
		class F extends Component implements CheckedComponent {
			value: unknown;
			@Attribute()
			checked = undefined;
		}

		it.should('set aria attributes when checked attribute changes', a => {
			const A = (<F $={checkedBehavior} />) as F;
			a.dom.appendChild(A);
			a.equal(A.getAttribute('aria-checked'), 'mixed');
			A.attributes$.next({
				target: A,
				attribute: 'value',
				value: false,
			});
			A.attributes$.next({
				target: A,
				attribute: 'checked',
				value: false,
			});
			a.equal(A.getAttribute('aria-checked'), 'false');

			A.attributes$.next({
				target: A,
				attribute: 'checked',
				value: true,
			});
			a.equal(A.getAttribute('aria-checked'), 'true');
		});
	});

	/*test('stopChildrenEvents', it => {
		it.should('stop propagation of children events', a => {
			let i = 0;
			const A = (
				<Span
					$={el =>
						merge(
							on(el, 'click').tap(() => i++),
							stopChildrenEvents(el, 'click'),
							on(el, 'click').tap(() => i++)
						)
					}
				/>
			) as Span;
			const B = (<Span />) as Span;
			a.dom.appendChild(A);
			A.appendChild(B);
			B.click();
			a.equal(i, 1);
			B.click();
			a.equal(i, 2);
		});
	});*/

	test('selectable', it => {
		@Augment<Selectable>(`cxl-test-${it.id}`, selectable)
		class Selectable extends Component {
			@Attribute()
			selected = false;
			@Attribute()
			value: unknown;
			view?: typeof Component;
		}

		@Augment<SelectableHost>(`cxl-test2-${it.id}`)
		class SelectableHost extends Component {
			options = new Set<Selectable>();
			optionView = Component;
			value: unknown;
		}

		@Augment<SelectableHostMultiple>(`cxl-test3-${it.id}`)
		class SelectableHostMultiple extends Component {
			options = new Set<Selectable>();
			selected = new Set<Selectable>();
			optionView = Component;
			value = [];
		}

		it.should('work with selectableHost', a => {
			let selected: Selectable | undefined;
			const A = (
				<SelectableHost
					$={el =>
						selectableHost(el, of(el)).tap(val => (selected = val))
					}
				>
					<Selectable value={1} />
					<Selectable value={2} />
					<Selectable value={3} />
					<Selectable value={4} />
				</SelectableHost>
			) as SelectableHost;
			a.dom.appendChild(A);
			const A0 = A.children[0] as Selectable;
			const A1 = A.children[0] as Selectable;
			a.equal(selected, A0);
			A1.click();
			a.equal(selected, A0);
		});
		it.should('work with selectableHostMultiple', a => {
			let selected: Selectable | undefined;
			const A = (
				<SelectableHostMultiple
					$={el =>
						selectableHostMultiple(el, of(el)).tap(
							val => (selected = val)
						)
					}
				>
					<Selectable />
					<Selectable />
					<Selectable />
					<Selectable />
				</SelectableHostMultiple>
			) as SelectableHostMultiple;
			a.dom.appendChild(A);
			a.ok(A);
			const A0 = A.children[0] as Selectable;
			A0.click();
			a.equal(selected, A0);
			a.ok(A.options.has(A0));
		});
	});

	test('staticTemplate', it => {
		it.should('create a template function', a => {
			const tpl = staticTemplate(() => <p>{a.id}</p>);
			const A = tpl() as HTMLParagraphElement;

			a.equal(A.tagName, 'P');
			a.equal(A.textContent, a.id.toString());
		});
	});
});
