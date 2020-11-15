import { be, merge, tap } from '../rx';
import { dom, observe } from '../tsx';
import { getAttribute, portal, teleport } from './index.js';
import { suite } from '../spec/index.js';

async function connect<T extends Node>(el: any, callback: (el: T) => any) {
	const subscriptions = observe(el).subscribe();
	try {
		await callback(el);
	} finally {
		subscriptions.unsubscribe();
	}
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
				a.dom.appendChild(el);
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

	test('portal', async a => {
		const id = 'cxl-test' + a.id;

		await connect<HTMLDivElement>(<div $={portal(id)} />, el => {
			teleport((<span>Hello</span>) as HTMLSpanElement, id)
				.subscribe()
				.unsubscribe();
			a.ok(el);
			a.equal(el.childNodes.length, 1);
			a.equal(el.childNodes[0]?.textContent, 'Hello');
		});
	});
});
