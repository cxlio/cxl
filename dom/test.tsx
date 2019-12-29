import { suite } from '../tester';
import { empty, setContent, setAttribute } from './index';
import { dom } from '../template';

export default suite('dom', test => {
	test('empty(Element)', a => {
		const el = (
			<div>
				content
				<span />
			</div>
		);

		a.equal(el.childNodes.length, 2);
		empty(el);
		a.equal(el.childNodes.length, 0);
	});

	test('setContent(Element, Element|TextNode)', a => {
		const el = <div />;

		a.equal(el.childNodes.length, 0);
		setContent(el, document.createElement('span'));
		a.equal(el.childNodes.length, 1);
		a.equal((el.childNodes[0] as Element).tagName, 'SPAN');
		setContent(el, 'Hello World');
		a.equal(el.childNodes.length, 1);
		a.equal((el.childNodes[0] as Element).textContent, 'Hello World');
	});

	test('setAttribute(Element, string, any)', a => {
		const el = <div />;

		setAttribute(el, 'test-attribute', 'value');
		a.equal(el.getAttribute('test-attribute'), 'value');

		setAttribute(el, 'test-attribute', null);
		a.equal(el.hasAttribute('test-attribute'), false);

		setAttribute(el, 'test-attribute', 'world');
		a.equal(el.getAttribute('test-attribute'), 'world');

		setAttribute(el, 'test-attribute', false);
		a.equal(el.hasAttribute('test-attribute'), false);
	});
});
