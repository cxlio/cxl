import { Observable, Subscription, tap, from } from '../rx/index.js';

type IntrinsicElement<T> =
	| {
			[K in keyof T]?: T[K] | Observable<T[K]>;
	  }
	| {
			$?: Binding<T>;
			children?: JSXChild | JSXChild[];
	  };

/* eslint @typescript-eslint/no-namespace: 'off' */
declare global {
	namespace JSX {
		interface ElementAttributesProperty {
			jsxAttributes: any;
		}
		interface ElementChildrenAttribute {
			children: {};
		}
		type Element = JSXElement;
		type IntrinsicElements = {
			[P in keyof HTMLElementTagNameMap]: IntrinsicElement<
				HTMLElementTagNameMap[P]
			>;
		};
	}
}

type Binding<ElementT = HTMLElement, DataT = any> = (
	el: ElementT,
	ctx: any
) => Observable<DataT>;
type NativeElementKey = keyof HTMLElementTagNameMap;
export type ElementChildren = JSXElement[];
type ViewBinding = Observable<any>;
type ComponentFunction = (
	attributes?: any,
	children?: ElementChildren
) => JSXElement;
type JSXChild = any;

interface JSXComponent<T> {
	create(): HTMLElement;
	new (): T;
}

interface Component {
	jsxAttributes?: any;
}

interface RenderContext {
	host: HTMLElement;
	bind(binding: Observable<any>): void;
}

export type JSXElement<T = any> = (context: RenderContext) => T;

function text(text: string) {
	return () => document.createTextNode(text);
}

function expression(binding: Observable<any>) {
	return (ctx?: RenderContext) => {
		const result = document.createTextNode('');
		if (ctx) ctx.bind(binding.pipe(tap(val => (result.textContent = val))));
		return result;
	};
}

export function normalizeChildren(children: any, result?: ElementChildren) {
	result = result || [];

	if (!Array.isArray(children)) children = [children];

	for (const child of children) {
		if (!child) continue;
		else if (Array.isArray(child)) normalizeChildren(child, result);
		else if (child instanceof Observable) result.push(expression(child));
		else if (typeof child === 'function') result.push(child);
		else result.push(text(child));
	}
	return result;
}

function renderChildren(
	children: ElementChildren,
	result: HTMLElement,
	context: RenderContext
) {
	for (const child of children) result.appendChild(child(context));
}

class NativeElement {
	private native?: HTMLElement;
	protected bindings?: Binding[];

	constructor(
		protected tagName: any,
		protected attributes?: any,
		protected children?: ElementChildren
	) {}

	protected renderElement() {
		return (
			this.native || (this.native = this.compile())
		).cloneNode() as HTMLElement;
	}

	protected compile() {
		const result = document.createElement(this.tagName);

		if (this.attributes) this.compileAttributes(this.attributes, result);
		if (this.children) this.children = normalizeChildren(this.children);

		return result;
	}

	protected compileAttributes(attributes: any, other?: any) {
		const bindings: Binding[] = [];

		for (const i in attributes) {
			const value = (attributes as any)[i];

			if (value instanceof Observable)
				bindings.push((el: any) =>
					value.pipe(tap(val => (el[i] = val)))
				);
			else if (typeof value === 'function') bindings.push(value);
			else {
				if (!other) other = {};
				other[i] = value;
			}
		}

		if (bindings.length) this.bindings = bindings;
		return other;
	}

	renderBindings(bindings: Binding[], el: any, ctx: RenderContext) {
		for (const b of bindings) ctx.bind(b(el, ctx));
	}

	render(ctx: RenderContext) {
		const result = this.renderElement();
		if (this.bindings) this.renderBindings(this.bindings, result, ctx);
		if (this.children) renderChildren(this.children, result, ctx);
		return result;
	}
}

class ComponentElement extends NativeElement {
	protected compiled = false;
	protected otherAttributes?: any;

	protected compile() {
		if (this.attributes)
			this.otherAttributes = this.compileAttributes(this.attributes);
		if (this.children) this.children = normalizeChildren(this.children);
		this.compiled = true;
	}

	protected renderElement() {
		if (!this.compiled) this.compile();

		const el = this.tagName.create();
		const other = this.otherAttributes;

		if (other) for (const a in other) (el as any)[a] = (other as any)[a];

		return el;
	}
}

class FunctionElement {
	private element?: JSXElement;

	constructor(
		protected Component: ComponentFunction,
		protected attributes?: any,
		protected children?: ElementChildren
	) {}

	compile() {
		let attributes = this.attributes;
		if (this.children) {
			attributes = attributes || {};
			attributes.children =
				this.children.length === 1 ? this.children[0] : this.children;
		}
		return (this.element = this.Component(attributes, this.children));
	}

	render(ctx: RenderContext) {
		const element = this.element || this.compile();
		return element(ctx);
	}
}

export function dom<T extends NativeElementKey>(
	name: T,
	attributes?: Partial<HTMLElementTagNameMap[T]>,
	...children: ElementChildren
): JSXElement<HTMLElementTagNameMap[T]>;
export function dom<T extends Component>(
	elementType: JSXComponent<T>,
	attributes?: T['jsxAttributes'],
	...children: ElementChildren
): JSXElement<T>;
export function dom<T, T2>(
	elementType: (attributes?: T2) => JSXElement<T>,
	attributes?: T2,
	...children: ElementChildren
): JSXElement<T>;
export function dom(
	elementType: any,
	attributes?: any,
	...children: ElementChildren
) {
	const element =
		typeof elementType === 'string'
			? new NativeElement(elementType, attributes, children)
			: new (elementType.create ? ComponentElement : FunctionElement)(
					elementType,
					attributes,
					children
			  );
	return element.render.bind(element);
}

export class Fragment {
	static create() {
		return document.createDocumentFragment();
	}
}

export class View<T> {
	private subscriptions?: Subscription<T>[];
	constructor(public element: T, private bindings: ViewBinding[]) {}
	connect() {
		if (!this.subscriptions)
			this.subscriptions = this.bindings.map(b => b.subscribe());
	}
	disconnect() {
		this.subscriptions?.forEach(s => s.unsubscribe());
	}
}

export function render<T>(tpl: JSXElement<T>, host?: HTMLElement) {
	const bindings: ViewBinding[] = [],
		context = {
			host: host || document.body,
			bind(b: Observable<any>) {
				bindings.push(b);
			}
		},
		element = tpl(context) as T;

	if (host) host.appendChild(element as any);

	return new View(element, bindings);
}

export function observe<T>(tpl: JSXElement<T>) {
	return new Observable<T>(subs => {
		const view = render(tpl);
		view.connect();
		subs.next(view.element);
		return () => view.disconnect();
	});
}

export function connect<T>(
	tpl: JSXElement<T>,
	fn: (el: T) => Promise<any> | Observable<any> | void
) {
	const view = render(tpl);
	view.connect();
	const result = fn(view.element);
	if (result)
		from(result).subscribe({ complete: view.disconnect.bind(view) });
	else view.disconnect();
}

export function Host({
	$,
	children
}: {
	$?: (node: any) => Observable<any>;
	children: any;
}) {
	children = normalizeChildren(children);
	return (ctx: RenderContext) => {
		if ($) ctx.bind($(ctx.host));

		const shadow =
			ctx.host.shadowRoot || ctx.host.attachShadow({ mode: 'open' });
		if (Array.isArray(children))
			children.forEach(c => shadow.appendChild(c(ctx)));
		else shadow.appendChild(children(ctx));
		return ctx.host;
	};
}