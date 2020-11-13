import { EMPTY, Observable, merge, observableSymbol } from '../rx/index.js';

/* eslint @typescript-eslint/no-namespace: 'off' */
/* eslint @typescript-eslint/ban-types: 'off' */
declare global {
	namespace dom {
		namespace JSX {
			interface ElementAttributesProperty {
				jsxAttributes: any;
			}
			interface ElementChildrenAttribute {
				children: {};
			}
			type Element = Node;
			type IntrinsicElements = {
				[P in keyof HTMLElementTagNameMap]: AttributeType<
					HTMLElementTagNameMap[P]
				>;
			};
		}
	}
}

export const $$bindings = Symbol('bindings');
export type Binding<T, DataT> = (el: T) => Observable<DataT>;
export type NodeBindings = Observable<any>[];

export type AttributeType<T> =
	| {
			[K in keyof T]?: T[K] | Observable<T[K]> | Binding<T, T[K]>;
	  }
	| {
			$?: Binding<T, any> | Observable<any>;
			children?: any;
	  };

interface Bindable extends Node {
	[$$bindings]?: NodeBindings;
	[observableSymbol]?: () => Observable<void>;
}

function toObservable(this: Bindable) {
	return this[$$bindings] ? merge(...this[$$bindings]) : EMPTY;
}

function initBindings(node: Bindable) {
	let bindings = node[$$bindings];

	if (!bindings) {
		node[observableSymbol] = toObservable;
		bindings = node[$$bindings] = [];
	}

	return bindings;
}

function bind(
	host: Bindable,
	binding: Observable<any> | Observable<any>[]
): void {
	const nodeBindings = initBindings(host);
	if (Array.isArray(binding)) nodeBindings.push(...binding);
	else nodeBindings.push(binding);
}

function expression(host: Bindable, binding: Observable<any>) {
	const result = document.createTextNode('');
	bind(
		host,
		binding.tap(val => (result.textContent = val))
	);
	return result;
}

function renderChildren(host: Node, children: any) {
	if (!children) return;

	if (Array.isArray(children))
		for (const child of children) renderChildren(host, child);
	else if (children instanceof Observable)
		host.appendChild(expression(host, children));
	else if (children instanceof Node) {
		host.appendChild(children);
		if ((children as any)[$$bindings])
			bind(host, (children as any)[$$bindings]);
	} else if (typeof children === 'function')
		renderChildren(host, children(host));
	else host.appendChild(document.createTextNode(children));
}

function renderAttributes(host: Node, attributes: any) {
	for (const attr in attributes) {
		const value = (attributes as any)[attr];

		if (value instanceof Observable)
			bind(
				host,
				attr === '$' ? value : value.tap(v => ((host as any)[attr] = v))
			);
		else if (typeof value === 'function') bind(host, value(host));
		else (host as any)[attr] = value;
	}
}

function renderElement(element: Node, attributes: any, children: any) {
	renderAttributes(element, attributes);
	renderChildren(element, children);
	return element;
}

function renderNativeElement(tagName: string, attributes: any, children: any) {
	return renderElement(document.createElement(tagName), attributes, children);
}

interface ComponentConstructor<T extends HTMLElement> {
	create(): T;
}

export function bindNode(node: Node, binding: Observable<any>) {
	bind(node, binding);
	return node;
}

export function observe(node: Bindable) {
	return toObservable.call(node);
}

export function getBindings(node: Bindable) {
	return node[$$bindings];
}

export function dom<T extends HTMLElement>(
	elementType: ComponentConstructor<T>,
	attributes?: AttributeType<T>,
	...children: any[]
): T;
export function dom<T, T2>(
	elementType: (attributes?: T2) => Bindable | Bindable[],
	attributes?: T2,
	...children: any[]
): T;
export function dom<K extends keyof HTMLElementTagNameMap>(
	elementType: K,
	attributes?: AttributeType<HTMLElementTagNameMap[K]>,
	...children: any[]
): HTMLElementTagNameMap[K];
export function dom(
	elementType: any,
	attributes?: any,
	...children: any[]
): Node {
	// Support for TSX Fragments
	if (elementType === dom)
		return renderElement(
			document.createDocumentFragment(),
			undefined,
			children
		);

	if (elementType.create)
		return renderElement(elementType.create(), attributes, children);
	if (!elementType.apply)
		return renderNativeElement(elementType, attributes, children);

	if (children) {
		children = children.length > 1 ? children : children[0];
		if (attributes) attributes.children = children;
		else attributes = { children };
	}

	return elementType(attributes);
}
