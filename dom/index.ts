///<amd-module name="@cxl/dom"/>
import {
	BehaviorSubject,
	EMPTY,
	Observable,
	Subject,
	Subscription,
	be,
	concat,
	defer,
	from,
	of,
	merge,
} from '@cxl/rx';

export type ElementContent = string | Node | undefined;
export type TemplateContent = string | Element | HTMLTemplateElement | NodeList;

export function empty(el: Element) {
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

export function onFontsReady(): Observable<void> {
	return from((document as any).fonts.ready);
}

const shadowConfig: ShadowRootInit = { mode: 'open' };
export function getShadow(el: Element) {
	return el.shadowRoot || el.attachShadow(shadowConfig);
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

export function observeChildren(el: Element) {
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
		})
	);
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
		if (subs.closed) return;
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
	target: Element,
	options: MutationObserverInit = { attributes: true, childList: true }
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
			})
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

export function onVisible(target: Element) {
	return onIntersection(target).map(ev => ev.isIntersecting);
}

export function isHidden(target: HTMLElement) {
	return target.offsetParent === null;
}
