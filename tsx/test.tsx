import { Test, suite } from '../spec/index.js';
import { dom, getBindings } from './index.js';
import { Observable, be, of, from } from '../rx/index.js';

async function connect(el: any, callback: (el: any[]) => any) {
	const subscriptions = from(el).subscribe();
	try {
		await callback(getBindings(el) || []);
	} finally {
		subscriptions.unsubscribe();
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
				{true}
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
		class Test {
			static create() {
				return document.createElement('div');
			}
			jsxAttributes?: {
				title: string;
				tabIndex: number;
				children: string;
			};
		}

		const el = (
			<Test title="hello" tabIndex={10}>
				Hello World
			</Test>
		) as HTMLDivElement;
		a.equal(el.tagName, 'DIV');
		a.equal(el.title, 'hello');
		a.equal(el.tabIndex, 10);
	});

	test('Component Function', a => {
		function TestChild({ children }: { children: any }) {
			return <h1>{children}</h1>;
		}

		function Test(p: { title: string; children: any }) {
			return (
				<div title={p.title}>
					<TestChild>{p.children}</TestChild>
				</div>
			);
		}

		const el = (
			<Test title="hello">
				<span>World</span>
			</Test>
		) as HTMLDivElement;

		a.equal(el.tagName, 'DIV');
		a.equal(el.title, 'hello');
		a.equal(el.childNodes.length, 1);

		const child = el.childNodes[0] as HTMLElement;
		a.equal(child.tagName, 'H1');
		const child2 = child.childNodes[0] as HTMLElement;
		a.equal(child2.tagName, 'SPAN');
		a.equal(child2.textContent, 'World');
	});

	test('Component - Function Binding', a => {
		let el3: any;
		function check(el2: any) {
			el3 = el2;
			a.equal(el2.tagName, 'DIV');
			return of('hello');
		}
		const el = <div $={check}></div>;
		a.equal(el, el3);
	});

	test('Component - Bindings', a => {
		class Div {
			static create() {
				return new Div();
			}
			bindings?: any[];
			jsxAttributes?: { $: (node: Div) => Observable<any> };
			title = '';
		}

		const el = (
			<Div $={el => of('blur').tap(ev => (el.title = ev))} />
		) as any;

		a.ok(el instanceof Div);
		connect(el, bindings => {
			a.equal(el.title, 'blur');
			a.equal(bindings.length, 1);
		});
	});

	test('Bindings - Children', a => {
		function Div(props?: {
			$?: (el: any) => Observable<any>;
			children?: any;
		}) {
			if (props) {
				a.ok(props.$ || props.children);
				const el = { title: '' };
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

	test('Bindings - Set Attribute', (a: Test) => {
		const checked = be(true);
		const el = (
			<div className={checked.map(val => (val ? 'minus' : 'check'))} />
		) as HTMLDivElement;

		a.ok(el);
		connect(el, bindings => {
			a.assert(bindings);
			a.equal(bindings.length, 1);
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
			<div>
				Hello {world}
				{world}
			</div>
		) as HTMLDivElement;
		a.ok(el);
		a.equal(el.childNodes.length, 3);
		await connect(el, bindings => {
			a.equal(bindings?.length, 2);
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
				{val}
			</>
		);
		a.ok(frag);
		a.equal(frag.childNodes.length, 3);
		await connect(frag, bindings => {
			a.equal(bindings?.length, 1);
			a.equal(frag.childNodes[2].nodeValue, 'hello');
		});
		val.next('world');
		a.equal(frag.childNodes[2].nodeValue, 'hello');
	});

	test('Empty Attribute', a => {
		const el = (<div draggable />) as any;
		a.ok(el.draggable, 'Must set attribute to true');
	});
});
