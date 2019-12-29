import { suite } from '../tester';
import { render, dom, setContent, log } from './index';
import { of } from '../rx';
import { on } from '../dom';

export default suite('template', test => {
	test('dom() - tsx', a => {
		const el = <div title="=style:@styleText =title:@title">content</div>;

		a.ok(el, 'Element was created');
		a.equal(el.tagName, 'DIV');
		a.equal((el as any).title, '=style:@styleText =title:@title');
		a.equal(el.textContent, 'content');
	});

	test('dom() - siblings', a => {
		const el = (
				<div>
					<a>1</a>
					<b>2</b>
					<c>3</c>
				</div>
			),
			first = el.firstChild,
			last = el.lastChild;

		a.equal(el.childNodes.length, 3);
		a.equal((el.childNodes[0] as Element).tagName, 'A');
		a.equal((el.childNodes[1] as Element).tagName, 'B');
		a.equal((el.childNodes[2] as Element).tagName, 'C');
		a.equal(el.childNodes[0].parentNode, el);
		a.equal(el.childNodes[1].parentNode, el);
		a.equal(el.childNodes[2].parentNode, el);
		a.equal(first, el.childNodes[0]);
		a.equal(last, el.childNodes[2]);
		a.equal(first && first.nextSibling, el.childNodes[1]);
		a.equal(last && last.previousSibling, el.childNodes[1]);
	});

	test('render', a => {
		const binding = (el: Element) => of('hello').pipe(setContent(el));

		render(() => <div $={binding} />)
			.subscribe(el => {
				a.ok(el);
				a.equal(el && el.childNodes.length, 1);
				a.equal(el && el.childNodes[0].textContent, 'hello');
			})
			.unsubscribe();
	});

	test('render - multiple bindings', a => {
		const bindings = (el: Element) => [
			of('hello').pipe(setContent(el)),
			on(el, 'click').pipe(log())
		];

		render(() => <div $={bindings} />)
			.subscribe(el => {
				a.ok(el);
				a.equal(el && el.childNodes.length, 1);
				a.equal(el && el.childNodes[0].textContent, 'hello');
			})
			.unsubscribe();

		a.ran(3);
	});
});
