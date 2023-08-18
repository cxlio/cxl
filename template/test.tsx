import { ListEvent, be, ref, of } from '@cxl/rx';
import { dom } from '@cxl/tsx';
import { Span } from '@cxl/component';
import { suite } from '@cxl/spec';
import { animationFrame } from '@cxl/dom';
import { each, list, portal, teleport, render, sortBy } from './index.js';

async function connect<T extends Node>(
	el: T,
	callback: (el: T) => void | Promise<void>
) {
	await callback(el);
}

export default suite('template', test => {
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
	});


	test('staticTemplate', it => {
		it.should('create a template function', a => {
			const tpl = staticTemplate(() => <p>{a.id}</p>);
			const A = tpl() as HTMLParagraphElement;

			a.equal(A.tagName, 'P');
			a.equal(A.textContent, a.id.toString());
		});
	});*/
});
