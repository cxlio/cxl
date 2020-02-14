import {
	merge,
	tap,
	map,
	filter,
	concat,
	of,
	Operator,
	Observable
} from '../rx/index.js';
import {
	setContent as domSetContent,
	on,
	trigger,
	AttributeObserver,
	MutationEvent
} from '../dom/index.js';

export type Template = () => Element;
export type Binding<ElementT, DataT = any> = Operator<ElementT, DataT>;
// export type Binding = Operator<HTMLElement>;
export interface Event {
	element: HTMLElement;
	data: any;
}

/*export function render<T extends JSXComponent>(tpl: JSXElement<T>): T {
	return tpl.render();
}*/

/*export function bind(bindingFn: (node: any) => Observable<any>) {
	return () => (node: any) => {
		node.view.addBinding(switchMap(bindingFn));
	};
}*/
/*
export class JSXElement<T extends JSXComponent = any> {
	// bindings?: Binding<T>;

	protected native?: T;
	protected otherAttributes?: T['jsxAttributes'];

	constructor(
		public Component: string | (new () => T),
		protected jsxAttributes?: T['jsxAttributes'],
		public children?: ElementChildren[]
	) {}

	protected renderElement(): T {
		const tagName =
			typeof this.Component === 'string'
				? this.Component
				: (this.Component as any).tagName;
		return document.createElement(tagName) as T;
	}

	protected compileAttributes(attributes: T['jsxAttributes'], result: T) {
		const bindings: Binding<T>[] = [];
		let other: any;

		for (const i in attributes) {
			const value = (attributes as any)[i];

			if (value instanceof Observable)
				bindings.push(
					switchMap((el: any) =>
						value.pipe(tap(val => (el[i] = val)))
					)
				);
			else if (typeof value === 'function')
				bindings.push(
					switchMap<T, T['jsxAttributes']>(el => value(el))
				);
			else {
				(result as any)[i] = value;
				if (!other) other = this.otherAttributes = {};
				other[i] = value;
			}
		}

		if (bindings.length) this.bindings = pipe(...bindings);
	}

	protected compileChildren(_children: (VirtualNode | string)[], _result: T) {
		// TODO
	}

	protected compileFragment() {
		return (this.native = document.createDocumentFragment() as any);
	}

	protected compile() {
		if ((this.Component as any) === DocumentFragment)
			return this.compileFragment();

		const result = (this.native = this.renderElement());

		if (this.jsxAttributes)
			this.compileAttributes(this.jsxAttributes, result);

		return result;
	}

	protected renderChildren(children: ElementChildren[], result: T) {
		children.forEach(child => {
			if (typeof child === 'string')
				result.appendChild(document.createTextNode(child));
			else {
				const childNode = child.render();
				result.appendChild(childNode);
			}
		});
	}

	protected cloneNode() {
		return (this.native || (this.native = this.compile())).cloneNode() as T;
	}

	render(): T {
		const result = this.cloneNode();
		const other = this.otherAttributes;

		if (other) for (const a in other) result[a] = (other as any)[a];

		if (this.bindings) (result as any).view.addBinding(this.bindings);
		if (this.children) this.renderChildren(this.children, result);

		return result;
	}
}
*/
export function getAttribute<T extends HTMLElement>(el: T, name: keyof T) {
	const observer = new AttributeObserver(el);
	return concat(
		of(el[name]),
		observer.pipe(
			filter(ev => ev.value === name),
			map(() => el[name])
		)
	);
}

export function triggerEvent(element: Element, event: string) {
	return tap(val => trigger(element, event, val));
}

export function setAttribute(el: Element, attribute: string) {
	return tap(val => ((el as any)[attribute] = val));
}

export function keypress(el: Element, key?: string) {
	return on(el, 'keypress').pipe(
		filter((ev: KeyboardEvent) => !key || ev.key.toLowerCase() === key)
	);
}

export function appendChild<T extends Element>(el: T) {
	return tap<Element>(node => {
		el.appendChild(node);
	});
}

export function onAction(el: Element) {
	return merge(on(el, 'click'));
}

export function value(el: Element) {
	return on(el, 'input').pipe(map(ev => ev.target.value));
}

export function location() {
	return on(window, 'hashchange').pipe(map(() => window.location.hash));
}

export function content(selector: string, el: HTMLSlotElement) {
	el.name = selector;
	return tap<MutationEvent>(({ type, value }) => {
		if (type === 'added' && value.matches && value.matches(selector)) {
			value.slot = selector;
		}
	});
}

export function setContent(el: Element) {
	return tap((val: any) => domSetContent(el, val));
}

export function log() {
	return tap(val => console.log(val));
}

/*
 * Portal
 */
const portals = new Map<string, HTMLElement>();

export function portal(id: string) {
	return (el: HTMLElement) => {
		portals.set(id, el);
		return new Observable(() => () => portals.delete(id));
	};
}

export function teleport(el: HTMLElement, portalName: string) {
	portals.get(portalName)?.appendChild(el);
}
