import { be, merge } from '@cxl/rx';
import { dom } from '@cxl/tsx';
import { Span } from '@cxl/component';
import { suite, triggerKeydown } from '@cxl/spec';
import { animationFrame, trigger } from '@cxl/dom';
import {
	getAttribute,
	navigationList,
	portal,
	teleport,
	model,
} from './index.js';

async function connect<T extends Node>(el: any, callback: (el: T) => any) {
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

		connect<HTMLInputElement>(
			<Span
				title="test"
				$={el =>
					merge(
						getAttribute(el, 'title').tap(onTitle),
						value.tap(onValue)
					)
				}
			/>,
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

		await connect<HTMLDivElement>(<Span $={portal(id)} />, el => {
			const subs = teleport(
				(<span>Hello</span>) as HTMLSpanElement,
				id
			).subscribe();
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
});
