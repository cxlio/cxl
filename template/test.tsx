/// <amd-module name="index" />
import { suite } from '../tester';
import { tap, merge, hook } from '../rx';
import { dom, connect } from '../xdom';
import { $on, portal, teleport, getAttribute } from './index.js';

function renderTest<T extends HTMLElement>(
	tpl: any,
	callback: (el: T) => void
) {
	connect<T>(tpl)
		.subscribe(callback)
		.unsubscribe();
}

export default suite('template', test => {
	test('bindings - get', a => {
		const done = a.async();
		const [value, setValue] = hook('');
		let first = true;

		function onTitle(val: string) {
			if (first) {
				a.equal(val, 'test');
				first = false;
			} else {
				a.equal(val, 'title');
				setValue('value');
			}
		}

		function onValue(val: string) {
			if (val) {
				a.equal(val, 'value');
				done();
			}
		}

		renderTest<HTMLInputElement>(
			<input
				title="test"
				$={el =>
					merge(
						getAttribute(el, 'title').pipe(tap(onTitle)),
						value.pipe(tap(onValue))
					)
				}
			/>,
			el => {
				a.ok(!first);
				el.title = 'title';
			}
		);
	});

	test('getAttribute - native', a => {
		const done = a.async();
		const el = document.createElement('div');
		const obs = getAttribute(el, 'title').pipe(
			tap(value => {
				el.setAttribute('aria-disabled', value ? 'true' : 'false');
				if (value) el.removeAttribute('tabindex');
				else el.tabIndex = 0;

				if (value === 'true') {
					subs.unsubscribe();
					done();
				}
			})
		);
		const subs = obs.subscribe();
		a.equal(el.getAttribute('aria-disabled'), 'false');
		a.equal(el.tabIndex, 0);
		el.setAttribute('title', 'true');
	});

	test('portal', a => {
		const id = 'cxl-test' + a.id;

		connect<HTMLDivElement>(<div $={portal(id)} />)
			.subscribe(el => {
				teleport((<span>Hello</span>)(), id);
				a.ok(el);
				a.equal(el.childNodes.length, 1);
				a.equal(el.childNodes[0]?.textContent, 'Hello');
			})
			.unsubscribe();
	});

	test('Events', a => {
		function onClick(ev: Event) {
			a.equal(ev.type, 'click');
		}
		renderTest(<div $={$on('click', onClick)}>Hello</div>, el => {
			el.click();
		});
	});
});
