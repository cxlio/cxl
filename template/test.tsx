/// <amd-module name="index" />
import { suite } from '../tester';
import { tap, map, hook } from '../rx';
import { on, setAttribute } from '../dom';
import { dom, render, Div, Span } from '../xdom';
import { portal, teleport } from './index.js';

export default suite('template', test => {
	test('bindings', a => {
		function touchable(el: HTMLElement) {
			return on(el, 'blur').pipe(
				tap(val => setAttribute(el, 'touched', val))
			);
		}
		a.ok(touchable);
		//render(() => $(<div />, touchable)).subscribe(el => a.ok(el));
	});

	test('attribute bindings', a => {
		const [checked, setChecked] = hook(true);
		const el = render(
			<Div
				className="box"
				title={checked.pipe(map(val => (val ? 'minus' : 'check')))}
			/>
		);
		a.dom.appendChild(el);
		a.ok(el);
		a.equal(el.className, 'box');
		a.equal(el.title, 'minus');
		setChecked(false);
		a.equal(el.title, 'check');
	});

	test('portal', a => {
		const id = 'cxl-test' + a.id;
		const el = render(<Div $={portal(id)} />);
		a.dom.appendChild(el);
		teleport(render(<Span>Hello</Span>), id);
		a.ok(el);
		a.equal(el.childNodes.length, 1);
		a.equal(el.childNodes[0]?.textContent, 'Hello');
	});
	/*
	test('getAttribute - html element', a => {
		const el = document.createElement('button');
		// const done = a.async();
		getAttribute(el, 'disabled')
			.subscribe(val => {
				a.equal(val, false);
			})
			.unsubscribe();
	});*/
});
