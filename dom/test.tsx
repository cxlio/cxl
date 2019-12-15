import { suite } from '../tester';
import { empty, setContent, setAttribute } from './index';

export = suite('dom', test => {
	test('dom() - tsx', a => {
		const el = <div title="=style:@styleText =title:@title">content</div>;

		a.ok(el, 'Element was created');
		a.equal(el.tagName, 'DIV');
		a.equal((el as any).title, '=style:@styleText =title:@title');
		a.equal(el.textContent, 'content');
	});

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
});
