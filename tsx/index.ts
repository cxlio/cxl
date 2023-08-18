///<amd-module name="@cxl/tsx"/>
import { Observable } from '@cxl/rx';

/* eslint @typescript-eslint/no-namespace: 'off' */
/* eslint @typescript-eslint/ban-types: 'off' */
declare global {
	namespace dom {
		namespace JSX {
			type ElementClass = Bindable;
			interface ElementAttributesProperty {
				jsxAttributes: unknown;
			}
			interface ElementChildrenAttribute {
				children: {};
			}
			type Element = Node;
			type IntrinsicElements = {
				[P in keyof HTMLElementTagNameMap]: NativeType<
					HTMLElementTagNameMap[P]
				>;
			};
			interface IntrinsicClassAttributes<T> {
				$?: Binding<T, unknown> | Observable<unknown>;
			}
		}
	}
}

export type Binding<T, DataT> = (el: T) => Observable<DataT>;
export type Child =
	| string
	| Node
	| number
	| ((host: Bindable) => Node)
	| undefined
	| Observable<unknown>;
export type Children = Child | Child[];
export type NativeChild = string | number | Node | undefined;
export type NativeChildren = NativeChild | NativeChild[];

export type NativeType<T> = {
	[K in keyof Omit<T, 'children'>]?: T[K];
} & {
	children?: NativeChildren;
};

export type Disallowed = Observable<unknown> | Function; //((...args: unknown[]) => unknown);

export type AttributeType<T> = {
	[K in keyof Omit<T, 'children' | '$'>]?: T[K] extends Disallowed
		? never
		: T[K] | Observable<T[K]>;
} & {
	children?: Children;
};

export interface Bindable extends Node {
	bind(binding: Observable<unknown>): void;
}

function bind(host: Bindable, binding: Observable<unknown>): void {
	if (!host.bind) throw new Error('Element not bindable');
	host.bind(binding);
}

export function expression(host: Bindable, binding: Observable<unknown>) {
	const result = document.createTextNode('');
	bind(
		host,
		binding.tap(val => (result.textContent = val as string))
	);
	return result;
}

export function renderChildren(
	host: Bindable | Node,
	children: Children,
	appendTo: Node = host
) {
	if (children === undefined || children === null) return;

	if (Array.isArray(children))
		for (const child of children) renderChildren(host, child, appendTo);
	else if (children instanceof Observable)
		appendTo.appendChild(expression(host as Bindable, children));
	else if (children instanceof Node) appendTo.appendChild(children);
	else if (typeof children === 'function')
		renderChildren(host, children(host as Bindable), appendTo);
	else appendTo.appendChild(document.createTextNode(children as string));
}

function renderAttributes<T extends Bindable>(host: T, attributes: Partial<T>) {
	for (const attr in attributes) {
		const value = attributes[attr];

		if (value instanceof Observable)
			bind(host, attr === '$' ? value : value.tap(v => (host[attr] = v)));
		else if (attr === '$' && typeof value === 'function')
			bind(host, value(host));
		else host[attr] = value as T[Extract<keyof T, string>];
	}
}

function renderElement<T extends Bindable>(
	element: T,
	attributes?: Partial<T>,
	children?: Children
) {
	if (attributes) renderAttributes(element, attributes);
	if (children) renderChildren(element, children);
	return element;
}

function renderNative<T extends Node>(
	element: T,
	attributes: Partial<T> | undefined,
	children: Children
) {
	for (const attr in attributes) {
		//if (attr === '$') attributes[attr](element);
		element[attr] = attributes[attr] as T[Extract<keyof T, string>];
	}
	if (children) renderChildren(element, children);
	return element;
}

interface ComponentConstructor<T extends Bindable> {
	create(): T;
}

function isConstructorType(el: unknown): el is ComponentConstructor<Bindable> {
	return !!(el as ComponentConstructor<Bindable>).create;
}

export function dom<T extends Bindable>(
	elementType: ComponentConstructor<T>,
	attributes?: AttributeType<T>,
	...children: Child[]
): T;
export function dom<T, T2>(
	elementType: (attributes?: T2) => Bindable /*| Bindable[]*/,
	attributes?: T2,
	...children: Child[]
): T;
export function dom<K extends keyof HTMLElementTagNameMap>(
	elementType: K,
	attributes?: NativeType<HTMLElementTagNameMap[K]>,
	...children: Child[]
): HTMLElementTagNameMap[K];
export function dom(
	elementType:
		| ComponentConstructor<Bindable>
		| ((attributes?: unknown) => Bindable),
	attributes?: unknown,
	...children: Child[]
): Node {
	// Support for TSX Fragments
	if (elementType === dom)
		return renderNative(
			document.createDocumentFragment(),
			undefined,
			children
		);

	if (isConstructorType(elementType))
		return renderElement(
			elementType.create(),
			attributes as Partial<Bindable>,
			children
		);

	if (typeof elementType === 'string')
		return renderNative(
			document.createElement(elementType),
			attributes as Partial<Bindable>,
			children
		);

	if (children) {
		const newChildren = children.length > 1 ? children : children[0];
		if (attributes)
			(attributes as AttributeType<Bindable>).children = newChildren;
		else attributes = { children: newChildren };
	}

	return elementType(attributes);
}

export default dom;
