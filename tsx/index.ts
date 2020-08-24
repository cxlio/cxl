import { Observable } from '../rx/index.js';

/* eslint @typescript-eslint/no-namespace: 'off' */
declare global {
	namespace JSX {
		interface ElementAttributesProperty {
			jsxAttributes: any;
		}
		interface ElementChildrenAttribute {
			children: {};
		}
		// type Element = HTMLElement;
		/*type IntrinsicElements = {
			[P in keyof HTMLElementTagNameMap]: AttributeType<
				HTMLElementTagNameMap[P]
			>;
		};*/
	}
}

export type AttributeType<T> =
	| {
			[K in keyof T]?: T[K] | Observable<T[K]> | Binding<T, T[K]>;
	  }
	| {
			$?: Binding<T, any>;
			children?: any;
	  };

export type Binding<T, DataT> = (el: T) => Observable<DataT>;

export interface JSXElement extends HTMLElement {
	jsxAttributes?: any;
	bind(binding: Observable<any>): void;
}

function expression(host: JSXElement, binding: Observable<any>) {
	const result = document.createTextNode('');
	host.bind(binding.tap(val => (result.textContent = val)));
	return result;
}

function renderChildren(host: any, children: any) {
	if (!children) return;

	if (Array.isArray(children))
		for (const child of children) renderChildren(host, child);
	else if (children instanceof Observable)
		host.appendChild(expression(host, children));
	else if (children instanceof Node) host.appendChild(children);
	else host.appendChild(document.createTextNode(children));
}

function renderAttributes(host: any, attributes: any) {
	for (const attr in attributes) {
		const value = (attributes as any)[attr];

		if (value instanceof Observable)
			host.bind(attr === '$' ? value : value.tap(v => (host[attr] = v)));
		else if (typeof value === 'function') host.bind(value(host));
		else host[attr] = attributes[attr];
	}
}

function renderElement(element: Element, attributes: any, children: any) {
	renderAttributes(element, attributes);
	renderChildren(element, children);
	return element;
}

export function dom<T extends keyof HTMLElementTagNameMap>(
	name: T,
	attributes?: Partial<HTMLElementTagNameMap[T]>,
	...children: any
): HTMLElementTagNameMap[T];
/*
export function dom<T extends Component>(
	elementType: ComponentType,
	attributes?: T['jsxAttributes'],
	...children: JSXElement[]
): JSXElement<T>;
export function dom<T, T2>(
	elementType: (attributes?: T2) => JSXElement<T>,
	attributes?: T2,
	...children: JSXElement[]
): JSXElement<T>;*/
export function dom(elementType: any, attributes?: any, ...children: any) {
	if (elementType.create)
		return renderElement(elementType.create(), attributes, children);

	if (typeof elementType === 'string')
		return renderElement(
			document.createElement(elementType),
			attributes,
			children
		);

	if (children) {
		if (attributes) attributes.children = children;
		else attributes = { children };
	}

	return elementType(attributes);
}

export function Head(p: { children: any }) {
	renderChildren(document.head, p.children);
}
