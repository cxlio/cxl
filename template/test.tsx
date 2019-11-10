import { suite } from '../tester';
import '../dom/virtual';
import { compile, View } from './index';
import { dom } from '../dom';

export default suite('template', test => {
	test('View', a => {
		const view = new View(document.createElement('div'), {
			title: 'Title',
			name: 'View'
		});

		view.store
			.select('title')
			.subscribe((title: string) => a.equal(title, 'Title'))
			.unsubscribe();
	});

	test('compile()', a => {
		const view = compile(
				<div $="=name:@className =title:@title @tagName:=tagName">
					<a>1</a>
					<b>2</b>
					<c>3</c>
				</div>,
				{
					title: 'Title',
					name: 'color',
					tagName: ''
				}
			),
			el = view.element.firstChild as HTMLElement;
		a.equal(el.tagName, 'DIV');
		a.equal(el.childNodes.length, 3);
		a.equal(el.className, 'color');
		a.equal(el.title, 'Title');
		a.equal(view.state.tagName, 'DIV');
	});

	test('sources', test => {
		test.test('getAttribute', a => {
			const view = compile(<a href="test" $="@href:=tagName" />, {
				tagName: ''
			});
			a.equal(view.state.tagName, 'test');
		});

		test.test('setAttribute', a => {
			const view = compile(<a $="=href:@href @href:=tagName" />, {
				href: 'test',
				tagName: ''
			});
			a.equal(view.state.tagName, 'test');
		});
	});
});
