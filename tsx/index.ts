///<amd-module name="@cxl/tsx"/>
import { Observable } from '@cxl/rx';

/* eslint @typescript-eslint/no-namespace: 'off' */
/* eslint @typescript-eslint/ban-types: 'off' */
declare global {
	namespace dom {
		namespace JSX {
			type ElementClass = Bindable;
			interface ElementAttributesProperty {
				jsxAttributes: any;
			}
			interface ElementChildrenAttribute {
				children: {};
			}
			type Element = Node;
			type IntrinsicElements = {
				[P in keyof HTMLElementTagNameMap]: NativeType<
					HTMLElementTagNameMap[P]
				>;
			}; /*&
				{
					[P in keyof SVGElementTagNameMap]: NativeType<
						SVGElementTagNameMap[P]
					>;
				};
			/*	type IntrinsicClassAttributes<T> = {
				[K in keyof Omit<T, 'children'>]?:
					| T[K]
					| Observable<T[K]>
					| Binding<T, T[K]>;
			} & {
				$?: Binding<T, any> | Observable<any>;
				children?: Children;
			};*/
		}
	}
}

export type Binding<T, DataT> = (el: T) => Observable<DataT>;
export type Child =
	| string
	| Node
	| number
	| ((host: Bindable) => Node)
	| Observable<any>;
export type Children = Child | Child[];
export type NativeChild = string | number | Node;
export type NativeChildren = NativeChild | NativeChild[];

export type NativeType<T> = {
	[K in keyof Omit<T, 'children'>]?: T[K];
} & {
	children?: NativeChildren;
};

export type AttributeType<T> = {
	[K in keyof Omit<T, 'children'>]?: T[K] | Observable<T[K]>;
	// | Binding<T, T[K]>;
} & {
	$?: Binding<T, any> | Observable<any>;
	children?: Children;
};

export interface Bindable extends Node {
	bind(binding: Observable<any>): void;
}

function bind(host: Bindable, binding: Observable<any>): void {
	if (!host.bind) throw new Error('Element not bindable');
	host.bind(binding);
}

export function expression(host: Bindable, binding: Observable<any>) {
	const result = document.createTextNode('');
	bind(
		host,
		binding.tap(val => (result.textContent = val))
	);
	return result;
}

export function renderChildren(
	host: Bindable,
	children: Children,
	appendTo: Node = host
) {
	if (children === undefined || children === null) return;

	if (Array.isArray(children))
		for (const child of children) renderChildren(host, child, appendTo);
	else if (children instanceof Observable)
		appendTo.appendChild(expression(host, children));
	else if (children instanceof Node) appendTo.appendChild(children);
	else if (typeof children === 'function')
		renderChildren(host, children(host), appendTo);
	else appendTo.appendChild(document.createTextNode(children as any));
}

function renderAttributes(host: Bindable, attributes: any) {
	for (const attr in attributes) {
		const value = (attributes as any)[attr];

		if (value instanceof Observable)
			bind(
				host,
				attr === '$' ? value : value.tap(v => ((host as any)[attr] = v))
			);
		else if (attr === '$' && typeof value === 'function')
			bind(
				host,
				//attr === '$'
				value(host)
				//: value(host).tap((v: any) => ((host as any)[attr] = v))
			);
		else (host as any)[attr] = value;
	}
}

function renderElement(element: Bindable, attributes: any, children: any) {
	if (attributes) renderAttributes(element, attributes);
	if (children) renderChildren(element, children);
	return element;
}

function renderNative(element: Node, attributes: any, children: any) {
	for (const attr in attributes) {
		if (attr === '$') attributes[attr](element);
		else (element as any)[attr] = attributes[attr];
	}
	if (children) renderChildren(element as any, children);
	return element;
}

interface ComponentConstructor<T extends Bindable> {
	create(): T;
}

/*function isSvg(tag: string) {
	return tag === 'svg' || tag === 'path';
}*/

export function dom<T extends Bindable>(
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
	attributes?: NativeType<HTMLElementTagNameMap[K]>,
	...children: any[]
): HTMLElementTagNameMap[K];
export function dom(
	elementType: any,
	attributes?: any,
	...children: any[]
): Node {
	// Support for TSX Fragments
	if (elementType === dom)
		return renderNative(
			document.createDocumentFragment(),
			undefined,
			children
		);

	if (elementType.create)
		return renderElement(elementType.create(), attributes, children);
	if (!elementType.apply)
		return renderNative(
			/*isSvg(elementType)
				? document.createElementNS(
						'http://www.w3.org/2000/svg',
						elementType
				  )
				: */
			document.createElement(elementType),
			attributes,
			children
		);

	if (children) {
		children = children.length > 1 ? children : children[0];
		if (attributes) attributes.children = children;
		else attributes = { children };
	}

	return elementType(attributes);
}

export default dom;
