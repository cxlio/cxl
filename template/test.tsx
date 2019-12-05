import { suite } from '../tester';
import { render, dom, setContent, log } from './index';
import { of } from '../rx';
import { on } from '../dom';

export default suite('template', test => {
	test('render', a => {
		const binding = () => of('hello').pipe(setContent());

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
