///<amd-module name="@cxl/dom"/>
import {
	BehaviorSubject,
	EMPTY,
	Observable,
	Subject,
	Subscriber,
	Subscription,
	be,
	concat,
	defer,
	from,
	of,
	merge,
	tap,
	operator,
} from '@cxl/rx';

declare global {
	interface Node {
		$$attributeObserver?: AttributeObserver;
		$$childrenObserver?: ChildrenObserver;
	}
}

export type ElementContent = string | Node | undefined;
export type TemplateContent = string | Element | HTMLTemplateElement | NodeList;

export interface CustomEventMap {}

export function empty(el: Element | DocumentFragment) {
	let c: Node;
	while ((c = el.childNodes[0])) el.removeChild(c);
}

export function setContent(el: Element, content: ElementContent) {
	empty(el);
	insert(el, content);
}

export function on<K extends keyof WindowEventMap>(
	element: Window,
	event: K,
	options?: AddEventListenerOptions,
): Observable<WindowEventMap[K]>;
export function on<K extends keyof HTMLElementEventMap>(
	element: EventTarget,
	event: K,
	options?: AddEventListenerOptions,
): Observable<HTMLElementEventMap[K]>;
export function on<K extends keyof CustomEventMap>(
	element: EventTarget | Window,
	event: K,
	options?: AddEventListenerOptions,
): Observable<CustomEvent<CustomEventMap[K]>>;
/*export function on(
	element: EventTarget | Window,
	event: string,
	options?: AddEventListenerOptions
): Observable<CustomEvent>;*/
export function on(
	element: EventTarget | Window,
	event: string,
	options?: AddEventListenerOptions,
): Observable<Event> {
	return new Observable<Event>(subscriber => {
		const handler = subscriber.next.bind(subscriber);
		element.addEventListener(event, handler, options);
		return element.removeEventListener.bind(
			element,
			event,
			handler,
			options,
		);
	});
}

export function onKeypress(el: Element | Window, key?: string) {
	return on(el, 'keydown').filter(
		// ev.key can be undefined in chrome, when autofilling
		(ev: KeyboardEvent) => !key || ev.key?.toLowerCase() === key,
	);
}

export function onAction(el: Element) {
	return on(el, 'click');
}

export function onReady() {
	return defer(() =>
		document.readyState !== 'loading'
			? of(true)
			: on(window, 'DOMContentLoaded')
					.first()
					.map(() => true),
	);
}

export function onLoad() {
	return defer(() =>
		document.readyState === 'complete'
			? of(true)
			: on(window, 'load')
					.first()
					.map(() => true),
	);
}

export function onFontsReady(): Observable<FontFaceSet> {
	return from(document.fonts.ready);
}

const shadowConfig: ShadowRootInit = { mode: 'open' };
export function getShadow(el: Element) {
	return el.shadowRoot || el.attachShadow(shadowConfig);
}

export function setAttribute(el: Element, attr: string, val: unknown) {
	if (val === false || val === null || val === undefined) val = null;
	else if (val === true) val = '';

	if (val === null) el.removeAttribute(attr);
	else el.setAttribute(attr, String(val));

	return val;
}

export function trigger<K extends keyof CustomEventMap>(
	el: EventTarget,
	event: K,
	options: CustomEventInit<CustomEventMap[K]>,
): void;
export function trigger<
	K extends keyof HTMLElementEventMap | keyof WindowEventMap,
>(el: EventTarget, event: K, options?: CustomEventInit): void;
export function trigger<T extends HTMLElement, K extends string>(
	el: T,
	event: K,
	options: CustomEventInit<EventDetail<T, K>>,
): void;
export function trigger(
	el: EventTarget,
	event: string,
	options?: CustomEventInit,
) {
	const ev = new CustomEvent(event, options);
	el.dispatchEvent(ev);
}

export type MutationEvent<T extends EventTarget = EventTarget> =
	| {
			type: 'added' | 'removed';
			target: T;
			value: Node;
	  }
	| {
			type: 'attribute';
			target: T;
			value: unknown;
	  };

export class AttributeObserver extends Subject<MutationEvent> {
	observer?: MutationObserver;
	bindings?: Subscription[];

	$onMutation(events: MutationRecord[]) {
		events.forEach(
			ev => ev.attributeName && this.trigger(ev.attributeName),
		);
	}

	$initializeNative(element: Node) {
		this.observer = new MutationObserver(this.$onMutation.bind(this));
		this.observer.observe(element, { attributes: true });
	}

	constructor(public element: Node) {
		super();

		if (element.$$attributeObserver) return element.$$attributeObserver;

		this.element = element;
		element.$$attributeObserver = this;
	}

	protected onSubscribe(
		subscription: Subscriber<MutationEvent<EventTarget>>,
	) {
		const el = this.element;
		// Use mutation observer for native dom elements
		if (!this.observer) this.$initializeNative(el);
		const unsubscribe = super.onSubscribe(subscription);

		return () => {
			unsubscribe();
			if (this.observers.size === 0) this.disconnect();
		};
	}

	disconnect() {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = undefined;
			this.bindings?.forEach(b => b.unsubscribe());
		}
	}

	trigger(attributeName: string) {
		this.next({
			type: 'attribute',
			target: this.element,
			value: attributeName,
		});
	}
}

export function observeChildren(el: Element): Observable<void> {
	let children: NodeListOf<ChildNode>;
	return merge(
		defer(() => {
			children = el.childNodes;
			return children ? of(children) : EMPTY;
		}),
		onChildrenMutation(el),
		onLoad().switchMap(() => {
			if (el.childNodes !== children) {
				children = el.childNodes;
				return of(children);
			}
			return EMPTY;
		}),
	) as unknown as Observable<void>;
}

export function onChildrenMutation(el: Element) {
	return new ChildrenObserver(el);
}

export function onAttributeChange(el: Element) {
	return new AttributeObserver(el);
}

export class ChildrenObserver extends Subject<MutationEvent> {
	private observer?: MutationObserver;

	constructor(private element: Element) {
		super();

		if (element.$$childrenObserver) return element.$$childrenObserver;

		this.element = element;
		element.$$childrenObserver = this;
	}

	$handleEvent(ev: MutationRecord) {
		const target = this.element;
		for (const value of ev.addedNodes)
			this.next({ type: 'added', target, value });
		for (const value of ev.removedNodes)
			this.next({ type: 'removed', target, value });
	}

	protected onSubscribe(
		subscription: Subscriber<MutationEvent<EventTarget>>,
	) {
		const el = this.element;

		if (!this.observer) {
			this.observer = new MutationObserver(events => {
				events.forEach(this.$handleEvent, this);
			});
			this.observer.observe(el, { childList: true });
		}

		const unsubscribe = super.onSubscribe(subscription);

		return () => {
			unsubscribe();
			if (this.observers.size === 0 && this.observer) {
				this.observer.disconnect();
				this.observer = undefined;
			}
		};
	}
}

export function onHashChange() {
	return concat(
		of(location.hash.slice(1)),
		on(window, 'hashchange').map(() => location.hash.slice(1)),
	);
}

let pushSubject: BehaviorSubject<unknown>;
export function onHistoryChange() {
	if (!pushSubject) {
		pushSubject = be(history.state);
		const old = history.pushState;
		history.pushState = function (...args) {
			const result = old.apply(this, args);
			if (history.state) history.state.lastAction = 'push';
			pushSubject.next(history.state);
			return result;
		};
	}
	return merge(
		on(window, 'popstate').map(() => {
			if (history.state) history.state.lastAction = 'pop';
			return history.state;
		}),
		pushSubject,
	);
}

export function onLocation() {
	let lastHref: string;
	return merge(onHashChange(), onHistoryChange())
		.map(() => window.location)
		.filter(loc => {
			const res = loc.href !== lastHref;
			lastHref = loc.href;
			return res;
		});
}

export const animationFrame = new Observable<number>(subs => {
	let frame = 0;
	let rafid = requestAnimationFrame(next);
	function next() {
		if (subs.closed) return;
		subs.next(frame++);
		rafid = requestAnimationFrame(next);
	}
	return () => cancelAnimationFrame(rafid);
});

export function findNextNode<T extends ChildNode>(
	el: T,
	fn: (el: T) => boolean,
	direction: 'nextSibling' | 'previousSibling' = 'nextSibling',
) {
	let node = el[direction] as T;

	while (node) {
		if (fn(node)) return node;
		node = node[direction] as T;
	}
}

export function findNextNodeBySelector(
	host: Element,
	el: Element,
	selector: string,
	direction = 1,
) {
	const all = Array.from(host.querySelectorAll(selector));
	let i = all.indexOf(el);
	if (i === -1) return null;
	if (i + direction >= all.length) i = all.length - 1;

	return all[i + direction] || null;
}

export function onResize(el: Element) {
	return new Observable(subs => {
		const observer = new ResizeObserver(ev => subs.next(ev));
		observer.observe(el);
		return () => observer.unobserve(el);
	});
}

export function insert(el: Element, content: ElementContent) {
	if (content === undefined) return;
	if (!(content instanceof Node)) content = document.createTextNode(content);
	el.appendChild(content);
}

export function fileReaderString(file: Blob) {
	return new Observable<string>(subs => {
		const fr = new FileReader();
		fr.readAsBinaryString(file);
		fr.addEventListener('load', () => {
			subs.next(fr.result as string);
			subs.complete();
		});
	});
}

export function onMutation(
	target: Node,
	options: MutationObserverInit = { attributes: true, childList: true },
) {
	return new Observable<MutationEvent>(subs => {
		const observer = new MutationObserver(events =>
			events.forEach(ev => {
				for (const value of ev.addedNodes)
					subs.next({ type: 'added', target, value });
				for (const value of ev.removedNodes)
					subs.next({ type: 'removed', target, value });
				if (ev.attributeName)
					subs.next({
						type: 'attribute',
						target,
						value: ev.attributeName,
					});
			}),
		);
		observer.observe(target, options);
		return () => observer.disconnect();
	});
}

export function onIntersection(target: Element) {
	return new Observable<IntersectionObserverEntry>(subs => {
		const observer = new IntersectionObserver(events => {
			for (const ev of events) subs.next(ev);
		});
		observer.observe(target);
		return () => observer.disconnect();
	});
}

export interface ElementWithValue<T> extends HTMLElement {
	value: T;
}

export function onValue<T extends ElementWithValue<R>, R = T['value']>(el: T) {
	return merge(on(el, 'input'), on(el, 'change')).map(
		ev => (ev.target as T).value,
	);
}

export function onVisible(target: Element) {
	return onIntersection(target).map(ev => ev.isIntersecting);
}

export function isHidden(target: HTMLElement) {
	return target.offsetParent === null;
}

export function isFocusable(el: HTMLElement) {
	return (
		(el.tabIndex !== -1 || el.contentEditable === 'true') &&
		!(el as HTMLInputElement).disabled
	);
}

export function findFocusable(
	host: Element | ShadowRoot,
): HTMLElement | undefined {
	for (const child of host.children) {
		if (child instanceof HTMLSlotElement) {
			const assigned = child.assignedElements();
			for (const item of assigned) {
				const result = findFocusable(item);
				if (result) return result;
			}
		} else if (child instanceof HTMLElement && isFocusable(child)) {
			return child;
		}
		if (child.shadowRoot?.children.length) {
			const result = findFocusable(child);
			if (result) return result;
		}
		if (child.children.length) {
			const result = findFocusable(child);
			if (result) return result;
		}
	}
}
export function findLastFocusable(
	host: Element | ShadowRoot,
): HTMLElement | undefined {
	let i = host.children.length;
	while (i--) {
		const child = host.children[i];
		if (child instanceof HTMLElement && isFocusable(child)) return child;
		if (child.children.length) {
			const result = findLastFocusable(child);
			if (result) return result;
		}
	}
}

function _findFocusableAll(host: Element, result: HTMLElement[]) {
	for (const child of host.children) {
		if (child instanceof HTMLElement && isFocusable(child))
			result.push(child);
		if (child.children) _findFocusableAll(child, result);
	}
	return result;
}

export function findFocusableAll(host: Element) {
	return _findFocusableAll(host, []);
}

function doRequest<T>(
	options: RequestInfo,
	parse?: (res: Response) => Promise<T>,
) {
	return new Observable<T>(subs => {
		fetch(options)
			.then(parse)
			.then(
				res => {
					subs.next(res);
					subs.complete();
				},
				err => subs.error(err),
			);
	});
}

export function request(options: RequestInfo) {
	return doRequest(options) as Observable<Response>;
}

export function requestJson<T = unknown>(options: RequestInfo): Observable<T> {
	return doRequest<T>(options, res => res.json());
}

export function setClassName(el: HTMLElement) {
	let className: string;
	return tap<string>(newClass => {
		if (className !== newClass) {
			el.classList.remove(className);
			className = newClass;
			if (className) el.classList.add(className);
		}
	});
}
export function debounceImmediate<A extends unknown[], R>(fn: (...a: A) => R) {
	let to: boolean;
	return function (this: unknown, ...args: A) {
		if (to) return;
		to = true;
		queueMicrotask(() => {
			fn.apply(this, args);
			to = false;
		});
	};
}

export function debounceRaf<A extends unknown[], R>(fn: (...a: A) => R) {
	let to: number;
	return function (this: unknown, ...args: A) {
		if (to) cancelAnimationFrame(to);
		to = requestAnimationFrame(() => {
			fn.apply(this, args);
			to = 0;
		});
	};
}

/**
 * debounce using requestAnimationFrame
 */
export function raf<T>(fn?: (val: T) => void) {
	return operator<T>(subscriber => {
		let to: number,
			completed = false;

		return {
			next(val: T) {
				if (to) cancelAnimationFrame(to);
				to = requestAnimationFrame(() => {
					if (fn) fn(val);
					subscriber.next(val);
					to = 0;
					if (completed) subscriber.complete();
				});
			},
			error(e) {
				subscriber.error(e);
			},
			complete() {
				if (to) completed = true;
				else subscriber.complete();
			},
			unsubscribe() {
				if (to) cancelAnimationFrame(to);
			},
		};
	});
}

export function nodeSort(a: Node, b: Node) {
	return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING
		? 1
		: -1;
}

export function sortNodes<T extends Node>(nodes: T[]) {
	return nodes.sort(nodeSort);
}

export type EventDetail<T, K extends string> = T[Extract<
	keyof T,
	`on${K}`
>] extends ((e: CustomEvent<infer D>) => void) | undefined
	? D
	: never;
