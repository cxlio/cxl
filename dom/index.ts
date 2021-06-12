///<amd-module name="@cxl/dom"/>
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
} from '@cxl/rx';

export type ElementContent = string | Node;
export type TemplateContent = string | Element | HTMLTemplateElement | NodeList;

export function empty(el: Element) {
	let c: Node;
	while ((c = el.childNodes[0])) el.removeChild(c);
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
): Observable<CustomEvent>;
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

export function onKeypress(el: Element | Window, key?: string) {
	return on(el, 'keydown').filter(
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
			: on(window, 'DOMContentLoaded')
					.first()
					.map(() => true)
	);
}

export function onLoad() {
	return defer(() =>
		document.readyState === 'complete'
			? of(true)
			: on(window, 'load')
					.first()
					.map(() => true)
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

export function trigger(el: EventTarget, event: string, detail?: any) {
	const ev = new CustomEvent(event, { detail: detail, bubbles: true });
	el.dispatchEvent(ev);
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

	protected onSubscribe(subscription: any) {
		const el = this.element as any;
		// Use mutation observer for native dom elements
		if (!el.$view && !this.observer) this.$initializeNative(el);
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
		subs.next(frame++);
		rafid = requestAnimationFrame(next);
	}
	return () => cancelAnimationFrame(rafid);
});

export function findNextNode<T extends ChildNode>(
	el: T,
	fn: (el: T) => boolean,
	direction: 'nextSibling' | 'previousSibling' = 'nextSibling'
) {
	let node = el[direction] as T;

	while (node) {
		if (fn(node)) return node;
		node = node[direction] as T;
	}
}

export function findNextNodeBySelector(
	el: Element,
	selector: string,
	direction:
		| 'nextElementSibling'
		| 'previousElementSibling' = 'nextElementSibling'
) {
	let node = el[direction];

	while (node) {
		if (node.matches(selector)) return node;
		node = node[direction];
	}
	return null;
}

export function onResize(el: Element) {
	return new Observable(subs => {
		const observer = new ResizeObserver(ev => subs.next(ev));
		observer.observe(el);
		return () => observer.unobserve(el);
	});
}

export function insert(el: Element, content: ElementContent) {
	if (!(content instanceof Node)) content = document.createTextNode(content);
	el.appendChild(content);
}
