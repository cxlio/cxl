import { TestApi, suite } from '@cxl/spec';
import { Observable, be, of, merge } from '@cxl/rx';
import dom from './index.js';
import { Children, NativeChildren, AttributeType } from './index.js';

class Span extends HTMLElement {
	jsxAttributes!: AttributeType<Span>;
	bindings: Observable<unknown>[] = [];

	static create() {
		const host = document.createElement('span') as Span;
		host.bindings = [];
		host.bind = binding => host.bindings.push(binding);
		return host;
	}
	bind(_binding: Observable<unknown>) {
		/** noop */
	}
}

async function connect(el: Span, callback: () => void | Promise<void>) {
	const subscription = merge(...(el.bindings || [])).subscribe();
	try {
		await callback();
	} finally {
		subscription.unsubscribe();
	}
}

export default suite('component', test => {
	test('NativeElement - empty', a => {
		const div = <div />;
		a.ok(div instanceof HTMLElement);
		a.equal(div.childNodes.length, 0);

		const div3 = dom('div');
		a.ok(div3 instanceof HTMLElement);
		a.equal(div3.childNodes.length, 0);
	});

	test('NativeElement - children', a => {
		const el = (
			<div>
				<a>Hello</a>
				<b>World</b>
				{10}
				{'true'}
			</div>
		) as HTMLDivElement;

		a.ok(el);
		a.equal(el.childNodes.length, 4);
		a.equal(el.children[0]?.tagName, 'A');
		a.equal(el.childNodes[0].childNodes[0].textContent, 'Hello');
		a.equal(el.children[1]?.tagName, 'B');
		a.equal(el.childNodes[1].childNodes[0].textContent, 'World');
		a.equal(el.childNodes[2].textContent, '10');
		a.equal(el.childNodes[3].textContent, 'true');
	});

	test('NativeElement - Attributes', a => {
		const el = (
			<div title="Hello World" tabIndex={10}>
				content
			</div>
		) as HTMLDivElement;

		a.ok(el, 'Element was created');
		a.equal(el.tagName, 'DIV');
		a.equal(el.title, 'Hello World');
		a.equal(el.tabIndex, 10);
		a.equal(el.textContent, 'content');
	});

	test('NativeELement - siblings', a => {
		const el = (
				<div>
					<a>1</a>
					<b>2</b>
					<i>3</i>
				</div>
			) as HTMLDivElement,
			first = el.firstChild,
			last = el.lastChild;

		a.equal(el.childNodes.length, 3);
		a.equal((el.childNodes[0] as HTMLElement).tagName, 'A');
		a.equal((el.childNodes[1] as HTMLElement).tagName, 'B');
		a.equal((el.childNodes[2] as HTMLElement).tagName, 'I');
		a.equal(el.childNodes[0].parentNode, el);
		a.equal(el.childNodes[1].parentNode, el);
		a.equal(el.childNodes[2].parentNode, el);
		a.equal(first, el.childNodes[0]);
		a.equal(last, el.childNodes[2]);
		a.equal(first && first.nextSibling, el.childNodes[1]);
		a.equal(last && last.previousSibling, el.childNodes[1]);
	});

	test('Component Class', a => {
		class TestApi extends Node {
			static create() {
				return document.createElement('div');
			}
			jsxAttributes?: {
				title: string;
				tabIndex: number;
				children: string;
			};
			bind() {
				/* */
			}
		}

		const el = (
			<TestApi title="hello" tabIndex={10}>
				Hello World
			</TestApi>
		) as HTMLDivElement;
		a.equal(el.tagName, 'DIV');
		a.equal(el.title, 'hello');
		a.equal(el.tabIndex, 10);
	});

	test('Component Function', a => {
		function TestApiChild({ children }: { children: Children }) {
			return <Span>{children}</Span>;
		}

		function TestApi(p: { title: string; children: Children }) {
			return (
				<div title={p.title}>
					<TestApiChild>{p.children}</TestApiChild>
				</div>
			);
		}

		const el = (
			<TestApi title="hello">
				<span>World</span>
			</TestApi>
		) as HTMLDivElement;

		a.equal(el.tagName, 'DIV');
		a.equal(el.title, 'hello');
		a.equal(el.childNodes.length, 1);

		const child = el.childNodes[0] as HTMLElement;
		a.equal(child.tagName, 'SPAN');
		const child2 = child.childNodes[0] as HTMLElement;
		a.equal(child2.tagName, 'SPAN');
		a.equal(child2.textContent, 'World');
	});

	test('Component - Function Binding', a => {
		let el3: Span | undefined;
		function check(el2: Span) {
			el3 = el2;
			a.equal(el2.tagName, 'SPAN');
			return of('hello');
		}
		const el = (<Span $={check} />) as Span;
		a.equal(el, el3);
	});

	test('Component - Bindings', a => {
		const el = (
			<Span $={el => of('blur').tap(ev => (el.title = ev))} />
		) as Span;

		connect(el, () => {
			a.equal(el.title, 'blur');
		});
	});

	test('Bindings - Children', a => {
		function Div(props?: {
			$?: (el: Span) => Observable<unknown>;
			children?: NativeChildren;
		}) {
			if (props) {
				a.ok(props.$ || props.children);
				const el = Span.create();
				if (props.$)
					props.$(el).subscribe(val => {
						a.equal(val, 'blur');
						a.equal(el.title, 'blur');
					});
			}

			return <div>{props?.children}</div>;
		}

		const el = (
			<Div>
				<Div $={el => of('blur').tap(ev => (el.title = ev))} />
			</Div>
		) as HTMLElement;

		a.ok(el);
		const child = el.childNodes[0] as HTMLDivElement;
		a.ok(child);
	});

	test('Bindings - Set Attribute', async (a: TestApi) => {
		const checked = be(true);
		const el = (
			<Span className={checked.map(val => (val ? 'minus' : 'check'))} />
		) as Span;

		a.ok(el);
		await connect(el, () => {
			a.equal(el.className, 'minus');
			checked.next(false);
			a.equal(el.className, 'check');
			checked.next(true);
			a.equal(el.className, 'minus');
		});
	});

	test('Bindings - Expression', async a => {
		const world = be('World');
		const el = (
			<Span>
				Hello {world}
				{world}
			</Span>
		) as Span;
		a.ok(el);
		await connect(el, () => {
			a.equal(el.childNodes.length, 3);
			a.equal(el.innerText, 'Hello WorldWorld');
			world.next('Universe');
			a.equal(el.innerText, 'Hello UniverseUniverse');
		});
		world.next('Galaxy');
		a.equal(el.innerText, 'Hello UniverseUniverse');
	});

	test('Fragment', async a => {
		const val = be('hello');
		const frag = (
			<>
				<div />
				<span />
				<Span>{val}</Span>
			</>
		);
		a.ok(frag);
		await connect(frag.childNodes[2] as Span, () => {
			a.equal(frag.childNodes.length, 3);
			a.equal(frag.childNodes[2].textContent, 'hello');
		});
		val.next('world');
		a.equal(frag.childNodes[2].textContent, 'hello');
	});

	test('Empty Attribute', a => {
		const el = (<div draggable />) as HTMLElement;
		a.ok(el.draggable, 'Must set attribute to true');
	});
});
