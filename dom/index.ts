import { Observable, Subject } from '../rx';

const EMPTY_NODE_REGEX = /\S/;

type Selector = (element: Node | Element) => boolean;
type Attributes = { [key: string]: string };

function $$find(
	child: Node | Element | null,
	selector: Selector,
	first: 'firstChild' | 'lastChild',
	next: 'nextSibling' | 'previousSibling'
): Node | null {
	let result;

	while (child) {
		if (selector(child)) return child;

		if (child[first]) {
			if ((result = $$find(child[first], selector, first, next)))
				return result;
		}

		child = child[next];
	}

	return null;
}

function $$findSelector(selector: string | Selector): Selector {
	if (typeof selector === 'string')
		return (item: any) => item.matches && item.matches(selector);

	return selector;
}

export function dom(tagName: string, attr: Attributes) {
	const el = createElement(tagName);

	for (const i in attr) el[i] = attr[i];

	return el;
}

function createElement(tagName: string) {
	return document.createElement(tagName);
}

function empty(el) {
	let c;
	while ((c = el.childNodes[0])) el.removeChild(c);
}

const event = {
	stop(ev) {
		ev.stopPropagation();
		ev.stopImmediatePropagation();
	},
	halt(ev) {
		ev.preventDefault();
		event.stop(ev);
	}
};

function find(el, selector) {
	return $$find(
		el.firstChild,
		$$findSelector(selector),
		'firstChild',
		'nextSibling'
	);
}

function findNext(child, selector) {
	return $$find(
		child.nextSibling,
		$$findSelector(selector),
		'firstChild',
		'nextSibling'
	);
}

function findPrevious(child, selector) {
	return $$find(
		child.previousSibling,
		$$findSelector(selector),
		'lastChild',
		'previousSibling'
	);
}

/**
 * Remove empty nodes
 * TODO Improve performance, or move it to build time.
 */
function normalize(node) {
	let child = node.firstChild;

	while (child) {
		const nodeType = child.nodeType;

		if (nodeType === Node.COMMENT_NODE) node.removeChild(child);
		else if (
			nodeType === Node.TEXT_NODE &&
			!EMPTY_NODE_REGEX.test(child.nodeValue)
		)
			node.removeChild(child);
		else if (nodeType === Node.ELEMENT_NODE && child.childNodes.length)
			normalize(child);

		child = child.nextSibling;
	}

	return node;
}

function query(el, selector, result) {
	var child = el.firstChild;
	result = result || [];

	while (child) {
		if (child.matches && child.matches(selector)) result.push(child);

		if (child.firstChild) query(child, selector, result);

		child = child.nextSibling;
	}

	return result;
}

function setContent(el, content) {
	empty(el);
	insert(el, content);
}

function on(element, event, handler, options) {
	element.addEventListener(event, handler, options);
	return element.removeEventListener.bind(element, event, handler, options);
}

function setAttribute(el, attr, val) {
	if (val === false || val === null || val === undefined) val = null;
	else if (val === true) val = '';
	else val = val.toString();

	if (val === null) el.removeAttribute(attr);
	else el.setAttribute(attr, val);

	return val;
}

function insert(el, content) {
	if (content === undefined || content === null) return;

	if (!(content instanceof window.Node))
		content = document.createTextNode(content);

	el.appendChild(content);
}

function isEmpty(el) {
	return el.childNodes.length === 0;
}

function removeChild(el, child) {
	el.removeChild(child);
}

function remove(child) {
	if (Array.isArray(child))
		return child.forEach(c => removeChild(c.parentNode, c));

	if (child.parentNode) removeChild(child.parentNode, child);
}

function setStyle(el, className, enable) {
	el.classList[enable || enable === undefined ? 'add' : 'remove'](className);
}

function trigger(el, event, detail) {
	var ev = new CustomEvent(event, { detail: detail, bubbles: true });
	el.dispatchEvent(ev);
}

export class NodeSnapshot {
	nodes: Node[];

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

class AttributeObserver extends Subject {
	$onMutation(events) {
		events.forEach(ev => this.trigger(ev.attributeName));
	}

	$onEvent() {
		if (this.element.value !== this.$value) {
			this.$value = this.element.value;
			this.trigger('value');
		}

		if (this.element.checked !== this.$checked) {
			this.$checked = this.element.checked;
			this.trigger('checked');
		}
	}

	$initializeNative(element) {
		this.observer = new MutationObserver(this.$onMutation.bind(this));
		this.observer.observe(element, { attributes: true });

		this.bindings = [
			new EventListener(element, 'change', this.$onEvent.bind(this))
		];
	}

	constructor(element) {
		if (element.$$attributeObserver) return element.$$attributeObserver;

		super();

		this.element = element;
		element.$$attributeObserver = this;
	}

	onSubscribe() {
		// Use mutation observer for native dom elements
		if (!this.element.$view && !this.observer)
			this.$initializeNative(this.element);
	}

	unsubscribe(s) {
		super.unsubscribe(s);

		if (this.__subscribers.length === 0) this.disconnect();
	}

	disconnect() {
		if (this.observer) {
			this.observer.disconnect();
			this.bindings.forEach(b => b.destroy());
		}
	}

	trigger(attributeName) {
		this.next(new MutationEvent('attribute', this.element, attributeName));
	}

	destroy() {
		super.destroy();
		this.disconnect();
	}
}

class Marker {
	constructor(element, text) {
		const parent = element.parentNode;

		this.node = document.createComment(text || '');
		this.children = [];
		this.element = element;
		parent.insertBefore(this.node, element);
		dom.remove(element);
		// TODO. Used by marker.empty directive
		element.$marker = this;
	}

	toggle(val, removeTo) {
		const el = this.element;

		if (val) this.node.parentNode.insertBefore(el, this.node);
		else {
			if (removeTo) removeTo.appendChild(el);
			else remove(el);
		}
	}

	insert(content, nextNode) {
		// TODO performance.
		this.children.push(new NodeSnapshot(content.childNodes));
		this.node.parentNode.insertBefore(content, nextNode || this.node);
	}

	empty() {
		this.children.forEach(snap => snap.remove());
		this.children = [];
	}
}

class ChildrenObserver extends Subject<MutationEvent> {
	private element: Element;
	private observer: MutationObserver;

	constructor(element: Element) {
		if ((element as any).$$childrenObserver)
			return (element as any).$$childrenObserver;

		super();
		this.element = element;
		(element as any).$$childrenObserver = this;
	}

	$handleEvent(ev) {
		for (const el of ev.addedNodes)
			this.next(new MutationEvent('added', this.element, el));
		for (const el of ev.removedNodes)
			this.next(new MutationEvent('removed', this.element, el));
	}

	onSubscribe() {
		if (!this.observer) {
			this.observer = new MutationObserver(events =>
				events.forEach(this.$handleEvent, this)
			);
			this.observer.observe(this.element, { childList: true });
		}
	}

	unsubscribe(s) {
		super.unsubscribe(s);

		if (this.__subscribers.length === 0) this.observer.disconnect();
	}

	destroy() {
		this.observer.disconnect();
	}
}

export function EventObservable(el: Element, event: string) {
	return new Observable(subscriber => {
		el.addEventListener(event, subscriber.next);
		return el.removeEventListener.bind(el, subscriber.next);
	});
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

Object.assign(dom, {
	createElement,
	empty,
	event,
	find,
	findNext,
	findPrevious,
	normalize,
	query,
	setContent,
	on,
	setAttribute,
	insert,
	removeChild,
	isEmpty,
	remove,
	setStyle,
	trigger
});
