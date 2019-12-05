import { Observable, Subscription, Subject } from '../rx';

type ElementContent = string | Node;
export type TemplateContent = string | Element | HTMLTemplateElement | NodeList;
export type VirtualChildren = (string | VirtualElement)[];

interface Callable {
	call(...arg: any): Observable<any>;
}
export type BindingFunction = Callable | ((el: Element) => Observable<any>);

interface Attributes {
	$?: BindingFunction | BindingFunction[];
	[k: string]: any;
}

declare global {
	namespace JSX {
		export interface IntrinsicElements {
			[tag: string]: Attributes;
		}
	}
}

export class VirtualElement {
	bindings?: [];

	constructor(
		public readonly tagName: string,
		public readonly attributes?: Attributes,
		public readonly children?: VirtualChildren
	) {}
}

export function render(element: VirtualElement): Element {
	const result = document.createElement(element.tagName);

	for (let attr in element.attributes)
		(result as any)[attr] = element.attributes[attr];

	if (element.children)
		element.children.forEach((child: any) => {
			child =
				typeof child === 'string'
					? document.createTextNode(child)
					: render(child);
			result.appendChild(child);
		});

	return result;
}

export function dom(
	tagName: string,
	attributes?: Attributes,
	...children: (string | Element)[]
): Element {
	const result = document.createElement(tagName);

	for (let i in attributes)
		if (i === '$') {
			const bind: any = attributes.$;

			if (bind.call)
				bind.call((dom as any).context, result, (dom as any).context);
			else
				bind.forEach((b: any) =>
					b.call((dom as any).context, result, (dom as any).context)
				);
		} else (result as any)[i] = attributes[i];

	if (children.length)
		children.forEach((child: any) => {
			child =
				typeof child === 'string'
					? document.createTextNode(child)
					: child;
			result.appendChild(child);
		});

	return result;
}

export function empty(el: Element) {
	let c;
	while ((c = el.childNodes[0])) el.removeChild(c);
}

export function setContent(el: Element, content: ElementContent) {
	empty(el);
	insert(el, content);
}

export function on(
	element: Element | Window,
	event: string,
	options?: AddEventListenerOptions
) {
	return new Observable<Event>(subscriber => {
		const handler = subscriber.next;
		element.addEventListener(event, handler, options);
		return element.removeEventListener.bind(
			element,
			event,
			handler,
			options
		);
	});
}

export function setAttribute(el: Element, attr: string, val: any) {
	if (val === false || val === null || val === undefined) val = null;
	else if (val === true) val = '';
	else val = val.toString();

	if (val === null) el.removeAttribute(attr);
	else el.setAttribute(attr, val);

	return val;
}

function insert(el: Element, content: ElementContent) {
	if (content === undefined || content === null) return;

	if (!(content instanceof Node)) content = document.createTextNode(content);

	el.appendChild(content);
}

export function isEmpty(el: Element) {
	return el.childNodes.length === 0;
}

function removeChild(el: Element, child: Node) {
	el.removeChild(child);
}

function remove(child: ChildNode) {
	if (Array.isArray(child))
		return child.forEach(c => removeChild(c.parentNode, c));

	if (child.parentNode) removeChild(child.parentNode as Element, child);
}

export function setStyle(el: Element, className: string, enable: boolean) {
	el.classList[enable || enable === undefined ? 'add' : 'remove'](className);
}

export function trigger(el: Element, event: string, detail: any) {
	var ev = new CustomEvent(event, { detail: detail, bubbles: true });
	el.dispatchEvent(ev);
}

export class NodeSnapshot {
	nodes: Node[] = [];

	constructor(nodes: NodeList) {
		for (const n of nodes) this.nodes.push(n);
	}

	appendTo(el: HTMLElement) {
		this.nodes.forEach(n => el.appendChild(n));
	}

	remove() {
		this.nodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));
	}
}

export class MutationEvent {
	constructor(public type: string, public target: any, public value: any) {}
}

export class AttributeObserver extends Subject<MutationEvent> {
	private $value: any;
	private $checked: any;

	element?: Element;
	observer?: MutationObserver;
	bindings?: Subscription<any>[];

	$onMutation(events: MutationRecord[]) {
		events.forEach(
			ev => ev.attributeName && this.trigger(ev.attributeName)
		);
	}

	$onEvent() {
		const el = this.element as any;

		if (el.value !== this.$value) {
			this.$value = el.value;
			this.trigger('value');
		}

		if (el.checked !== this.$checked) {
			this.$checked = el.checked;
			this.trigger('checked');
		}
	}

	$initializeNative(element: Element) {
		this.observer = new MutationObserver(this.$onMutation.bind(this));
		this.observer.observe(element, { attributes: true });

		this.bindings = [
			on(element, 'change').subscribe(this.$onEvent.bind(this))
		];
	}

	constructor(element: Element) {
		super();

		if ((element as any).$$attributeObserver)
			return (element as any).$$attributeObserver;

		this.element = element;
		(element as any).$$attributeObserver = this;
	}

	onSubscribe(subscription: any) {
		const el = this.element as any;
		// Use mutation observer for native dom elements
		if (!el.$view && !this.observer) this.$initializeNative(el);

		return super.onSubscribe(subscription);
	}

	unsubscribe() {
		if (this.subscriptions.size === 0) this.disconnect();
	}

	disconnect() {
		if (this.observer) {
			this.observer.disconnect();
			if (this.bindings) this.bindings.forEach(b => b.unsubscribe());
		}
	}

	trigger(attributeName: string) {
		this.next(new MutationEvent('attribute', this.element, attributeName));
	}

	destroy() {
		this.disconnect();
	}
}

export class Marker {
	node: Comment;
	children: NodeSnapshot[] = [];

	constructor(public element: Element, text: string) {
		const parent = element.parentNode;
		const node = (this.node = document.createComment(text || ''));

		if (parent) {
			parent.insertBefore(node, element);
		} else throw new Error('Invalid Parent Node');

		remove(element);
		// TODO. Used by marker.empty directive
		(element as any).$marker = this;
	}

	toggle(val: boolean, removeTo: Element) {
		const el = this.element,
			parent = this.node.parentNode;

		if (val && parent) parent.insertBefore(el, this.node);
		else {
			if (removeTo) removeTo.appendChild(el);
			else remove(el);
		}
	}

	insert(content: Element, nextNode: Node) {
		// TODO performance.
		this.children.push(new NodeSnapshot(content.childNodes));

		if (this.node.parentNode)
			this.node.parentNode.insertBefore(content, nextNode || this.node);
	}

	empty() {
		this.children.forEach(snap => snap.remove());
		this.children = [];
	}
}

export class ChildrenObserver extends Subject<MutationEvent> {
	private element?: Element;
	private observer?: MutationObserver;

	constructor(element: Element) {
		if ((element as any).$$childrenObserver)
			return (element as any).$$childrenObserver;

		super();
		this.element = element;
		(element as any).$$childrenObserver = this;
	}

	$handleEvent(ev: MutationRecord) {
		for (const el of ev.addedNodes)
			this.next(new MutationEvent('added', this.element, el));
		for (const el of ev.removedNodes)
			this.next(new MutationEvent('removed', this.element, el));
	}

	protected onSubscribe(subscription: any) {
		if (!this.observer) {
			this.observer = new MutationObserver(events =>
				events.forEach(this.$handleEvent, this)
			);
			if (this.element)
				this.observer.observe(this.element, { childList: true });
		}
		return super.onSubscribe(subscription);
	}

	unsubscribe() {
		if (this.subscriptions.size === 0 && this.observer)
			this.observer.disconnect();
	}

	destroy() {
		if (this.observer) this.observer.disconnect();
	}
}

export class ElementChildren {
	constructor(private element: HTMLElement) {
		if ((element as any).$$elementChildren)
			return (element as any).$$elementChildren;
	}

	get first() {
		return this.element.firstElementChild;
	}
	get last() {
		return this.element.lastElementChild;
	}
}

export class Fragment {
	static getFragmentFromString(content: string) {
		// We use <template> so components are not initialized
		const template = document.createElement('template');
		template.innerHTML = content.trim();
		return template.content;
	}

	static getDocumentFragment(content: TemplateContent) {
		if (typeof content === 'string')
			return Fragment.getFragmentFromString(content);

		if (content instanceof HTMLTemplateElement) return content.content;
		else if (content instanceof Element) {
			const result = document.createDocumentFragment();
			result.appendChild(content);
			return result;
		}

		const result = document.createDocumentFragment();

		while (content.length) result.appendChild(content[0]);

		return result;
	}

	private content: DocumentFragment;

	constructor(content: TemplateContent) {
		this.content = Fragment.getDocumentFragment(content);
	}

	clone() {
		return document.importNode(this.content, true);
	}
}
