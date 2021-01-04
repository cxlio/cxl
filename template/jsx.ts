import { Observable, tap } from '@cxl/rx';

export type Elements = {
	[P in keyof HTMLElementTagNameMap]: Partial<HTMLElementTagNameMap[P]>;
};

interface CustomElementInstance extends Partial<HTMLElement> {
	[prop: string]: any;
}

/* eslint @typescript-eslint/no-namespace: 'off' */
declare global {
	namespace JSX {
		interface ElementAttributesProperty {
			jsxAttributes: any;
		}
		interface IntrinsicElements extends Elements {
			[customElement: string]: CustomElementInstance;
		}
	}
}

type CustomElement<T> = {
	tagName: string;
	new (): T;
};

type Context = Observable<any>[];
type JSXTag = string | CustomElement<any> | (() => Element);

let domContext: Context;

function setAttribute<T, T2>(result: T, attr: keyof T, val: T2) {
	if (result[attr] instanceof Observable)
		domContext.push((result[attr] as any).pipe(val));
	else if (val instanceof Observable)
		domContext.push(val.pipe(tap(val2 => (result[attr] = val2))));
	else result[attr] = val as any;
}

function createElement(tag: JSXTag) {
	return typeof tag === 'string'
		? document.createElement(tag)
		: tag instanceof HTMLElement
		? document.createElement(tag.tagName || 'div')
		: (tag as any)();
}

function getChildNode(node: string | Node | Observable<any>) {
	if (node instanceof Observable) {
		const result = document.createTextNode('');
		domContext.push(node.pipe(tap(val => (result.textContent = val))));
		return result;
	}

	return node instanceof Node ? node : document.createTextNode(node);
}

export function $<T>(obs: Observable<T>): T {
	return obs as any;
}

export function render<T extends HTMLElement>(template: () => T) {
	const oldContext = domContext;
	const bindings: Context = (domContext = []);
	const el = template();
	domContext = oldContext;
	return new Observable<T>(subs => {
		const subscriptions = bindings.map(b => b.subscribe());
		subs.next(el);
		return () => subscriptions.forEach(s => s.unsubscribe());
	});
}

export function renderContext(ctx: Context, template: () => HTMLElement) {
	const oldContext = domContext;
	domContext = ctx;
	const result = template();
	domContext = oldContext;
	return result;
}

export function dom<T extends HTMLElement>(
	el: JSXTag,
	attributes?: Partial<T>,
	...children: (string | Node)[]
): T {
	const result = createElement(el);

	for (const i in attributes) setAttribute(result, i as any, attributes[i]);

	for (const child of children) result.appendChild(getChildNode(child));

	return result as T;
}
