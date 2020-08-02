import {
	BehaviorSubject,
	Observable,
	Subject,
	Subscription,
	be,
	concat,
	defer,
	of,
	merge,
} from '../rx/index.js';

type ElementContent = string | Node;
export type TemplateContent = string | Element | HTMLTemplateElement | NodeList;

export function empty(el: Element) {
	let c: Node;
	while ((c = el.childNodes[0])) el.removeChild(c);
}

export function createElement<T extends keyof HTMLElementTagNameMap>(
	name: T,
	attributes?: Partial<HTMLElementTagNameMap[T]>
): HTMLElementTagNameMap[T];
export function createElement<T>(
	elementType: { create(): any; new (): T },
	attributes?: Partial<T>
): T;
export function createElement(elementType: any, attributes?: any) {
	const element =
		typeof elementType === 'string'
			? document.createElement(elementType)
			: elementType.create();

	if (attributes)
		for (const attr in attributes) element[attr] = attributes[attr];

	return element;
}

export function on<K extends keyof WindowEventMap>(
	element: Window,
	event: K,
	options?: AddEventListenerOptions
): Observable<WindowEventMap[K]>;
export function on<K extends keyof GlobalEventHandlersEventMap>(
	element: EventTarget,
	event: K,
	options?: AddEventListenerOptions
): Observable<GlobalEventHandlersEventMap[K]>;
export function on(
	element: EventTarget | Window,
	event: string,
	options?: AddEventListenerOptions
): Observable<Event>;
export function on(
	element: EventTarget | Window,
	event: string,
	options?: AddEventListenerOptions
): Observable<Event> {
	return new Observable<Event>(subscriber => {
		const handler = subscriber.next.bind(subscriber);
		element.addEventListener(event, handler, options);
		return element.removeEventListener.bind(
			element,
			event,
			handler,
			options
		);
	});
}

export function onKeypress(el: Element, key?: string) {
	return on(el, 'keypress').filter(
		(ev: KeyboardEvent) => !key || ev.key.toLowerCase() === key
	);
}

export function onAction(el: Element) {
	return merge(on(el, 'click'), onKeypress(el, 'enter'));
}

export function onReady() {
	return defer(() =>
		document.readyState !== 'loading'
			? of(true)
			: on(window, 'DOMContentLoaded').map(() => true)
	);
}

export function onLoad() {
	return defer(() =>
		document.readyState === 'complete'
			? of(true)
			: on(window, 'load').map(() => true)
	);
}

export function getShadow(el: Element) {
	return (
		el.shadowRoot ||
		el.attachShadow({
			mode: 'open',
		})
	);
}

export function setAttribute(el: Element, attr: string, val: any) {
	if (val === false || val === null || val === undefined) val = null;
	else if (val === true) val = '';
	else val = val.toString();

	if (val === null) el.removeAttribute(attr);
	else el.setAttribute(attr, val);

	return val;
}

function insertContent(el: Element, content: ElementContent) {
	if (content === undefined || content === null) return;
	if (!(content instanceof Node)) content = document.createTextNode(content);
	el.appendChild(content);
}

export function insertArray(el: Element, content: ElementContent[]) {
	for (const child of content) insertContent(el, child);
}

export function insert(
	el: Element,
	content: ElementContent | ElementContent[]
) {
	if (Array.isArray(content)) {
		insertArray(el, content);
		return;
	} else insertContent(el, content);
}

export function setContent(el: Element, content: ElementContent) {
	empty(el);
	insert(el, content);
}

export function isEmpty(el: Element) {
	return el.childNodes.length === 0;
}

function removeChild(el: Element, child: Node) {
	el.removeChild(child);
}

export function remove(child: ChildNode) {
	if (Array.isArray(child))
		return child.forEach(c => removeChild(c.parentNode, c));

	if (child.parentNode) removeChild(child.parentNode as Element, child);
}

export function setStyle(el: Element, className: string, enable: boolean) {
	el.classList[enable || enable === undefined ? 'add' : 'remove'](className);
}

export function trigger(el: EventTarget, event: string, detail?: any) {
	const ev = new CustomEvent(event, { detail: detail, bubbles: true });
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

export interface MutationEvent<T extends EventTarget = EventTarget> {
	type: 'added' | 'removed' | 'attribute';
	target: T;
	value: any;
}

export class AttributeObserver extends Subject<MutationEvent> {
	private $value: any;
	private $checked: any;

	observer?: MutationObserver;
	bindings?: Subscription[];

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
			on(element, 'change').subscribe(this.$onEvent.bind(this)),
		];
	}

	constructor(public element: Node) {
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
		if (this.observers.size === 0) this.disconnect();
	}

	disconnect() {
		if (this.observer) {
			this.observer.disconnect();
			if (this.bindings) this.bindings.forEach(b => b.unsubscribe());
		}
	}

	trigger(attributeName: string) {
		this.next({
			type: 'attribute',
			target: this.element,
			value: attributeName,
		});
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

export function onChildrenMutation(el: Element) {
	return new ChildrenObserver(el);
}

export class ChildrenObserver extends Subject<MutationEvent> {
	private observer?: MutationObserver;

	constructor(private element: Element) {
		super();

		if ((element as any).$$childrenObserver)
			return (element as any).$$childrenObserver;

		this.element = element;
		(element as any).$$childrenObserver = this;
	}

	$handleEvent(ev: MutationRecord) {
		const target = this.element;
		for (const value of ev.addedNodes)
			this.next({ type: 'added', target, value });
		for (const value of ev.removedNodes)
			this.next({ type: 'removed', target, value });
	}

	protected onSubscribe(subscription: any) {
		const el = this.element;

		if (!this.observer) {
			this.observer = new MutationObserver(events =>
				events.forEach(this.$handleEvent, this)
			);
			if (el) this.observer.observe(el, { childList: true });
		}

		if (el)
			for (const node of el.childNodes)
				subscription.next({ type: 'added', target: el, value: node });

		return super.onSubscribe(subscription);
	}

	unsubscribe() {
		if (this.observers.size === 0 && this.observer)
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

export function onHashChange() {
	return concat(
		of(location.hash.slice(1)),
		on(window, 'hashchange').map(() => location.hash.slice(1))
	);
}

let pushSubject: BehaviorSubject<any>;
export function onHistoryChange() {
	if (!pushSubject) {
		pushSubject = be(history.state);
		const old = history.pushState;
		history.pushState = function (...args: any) {
			const result = old.apply(this, args);
			pushSubject.next(history.state);
			return result;
		};
	}
	return merge(
		on(window, 'popstate').map(() => history.state),
		pushSubject
	);
}

export function onLocation() {
	return merge(onHashChange(), onHistoryChange()).map(() => window.location);
}
