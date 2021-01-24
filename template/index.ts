import {
	AttributeObserver,
	setContent as domSetContent,
	on,
	trigger,
} from '@cxl/dom';
import {
	ListEvent,
	Observable,
	Operator,
	concat,
	defer,
	merge,
	observable,
	of,
	tap,
} from '@cxl/rx';
import { Bindable, NativeChildren, dom } from '@cxl/tsx';
import { Styles, render as renderCSS } from '@cxl/css';
import { Component, staticTemplate } from '@cxl/component';

interface ElementWithValue<T> extends HTMLElement {
	value: T;
}

interface ValueElement extends Element {
	value: boolean | undefined;
}

function isObservedAttribute(el: any, attr: any) {
	return (el.constructor as any).observedAttributes?.includes(attr);
}

export function sortBy<T, K extends keyof T>(key: K) {
	return (a: T, b: T) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0);
}

export function getSearchRegex(term: string) {
	try {
		return new RegExp(term, 'i');
	} catch (e) {
		return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
	}
}

export function getAttribute<T extends Node, K extends keyof T>(
	el: T,
	name: K
) {
	const attr$ = (el as any).attributes$;
	const observer =
		attr$ && isObservedAttribute(el, name)
			? attr$.filter((ev: any) => ev.attribute === name)
			: new AttributeObserver(el).filter(ev => ev.value === name);
	return concat<Observable<T[K]>[]>(
		defer(() => of(el[name])),
		observer.map(() => el[name])
	);
}

export function triggerEvent<R>(element: EventTarget, event: string) {
	return tap<R>((val: R) => trigger(element, event, val));
}

export function setAttribute(el: Element, attribute: string) {
	return tap(val => ((el as any)[attribute] = val));
}

export function stopEvent<T extends Event>() {
	return tap<T>((ev: T) => ev.stopPropagation());
}

export function show(el: HTMLElement) {
	return tap<boolean>(val => (el.style.display = val ? '' : 'none'));
}

export function hide(el: HTMLElement) {
	return tap<boolean>(val => (el.style.display = val ? 'none' : ''));
}

export function sync<T>(
	getA: Observable<T>,
	setA: (val: T) => void,
	getB: Observable<T>,
	setB: (val: T) => void
) {
	let value: T;
	return merge(
		getA.tap(val => val !== value && setB((value = val))),
		getB.tap(val => val !== value && setA((value = val)))
	);
}

export function syncAttribute(A: Node, B: Node, attr: string) {
	return sync(
		getAttribute(A, attr as any),
		val => ((A as any)[attr] = val),
		getAttribute(B, attr as any),
		val => ((B as any)[attr] = val)
	);
}

interface NextObservable<T> extends Observable<T> {
	next(val: T): void;
}

export function model<T>(el: ElementWithValue<T>, ref: NextObservable<T>) {
	return ref.switchMap(initial => {
		el.value = initial;
		return sync(
			onValue(el),
			val => (el.value = val),
			ref,
			ref.next.bind(ref)
		);
	});
}

export function onValue<T extends ElementWithValue<R>, R = T['value']>(el: T) {
	return merge(on(el, 'input'), on(el, 'change'))
		.map(ev => (ev.target as T).value)
		.raf();
}

export function setContent(el: Element) {
	return tap((val: any) => domSetContent(el, val));
}

const LOG = tap(val => console.log(val));

declare module '../rx' {
	interface Observable<T> {
		log(): Observable<T>;
		raf(fn?: (val: T) => void): Observable<T>;
	}
}

Observable.prototype.log = function () {
	return this.pipe(LOG);
};

Observable.prototype.raf = function (fn?: (val: any) => void) {
	return this.pipe(raf(fn));
};

/**
 * debounce using requestAnimationFrame
 */
export function raf<T>(fn?: (val: T) => void) {
	return (source: Observable<T>) => {
		let to: number,
			completed = false;

		return new Observable<T>(subscriber => {
			const subs = source.subscribe({
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
					if (to) cancelAnimationFrame(to);
					subscriber.error(e);
				},
				complete() {
					if (to) completed = true;
					else subscriber.complete();
				},
			});
			return () => subs.unsubscribe();
		});
	};
}

export function log<T>() {
	return LOG as Operator<T>;
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

export function teleport(el: Node, portalName: string) {
	return new Observable<void>(() => {
		portals.get(portalName)?.appendChild(el);
		return () => el.parentElement?.removeChild(el);
	});
}

class Marker {
	private children: Node[] = [];
	node = document.createComment('marker');

	insert(content: Node, nextNode: Node = this.node) {
		if (content instanceof DocumentFragment) {
			this.children.push(...content.childNodes);
		} else this.children.push(content);
		this.node.parentNode?.insertBefore(content, nextNode);
	}

	empty() {
		const parent = this.node.parentNode;

		if (!parent) return;

		this.children.forEach(snap => parent.removeChild(snap));
		this.children = [];
	}
}

export function list<T>(
	source: Observable<ListEvent<T>>,
	renderFn: (item: T) => Node
) {
	const marker = new Marker();
	return (host: Bindable) => {
		host.bind(
			source.tap(ev => {
				if (ev.type === 'insert') marker.insert(renderFn(ev.item));
				else if (ev.type === 'empty') marker.empty();
			})
		);
		return marker.node;
	};
}

export function render<T>(
	source: Observable<T>,
	renderFn: (item: T) => Node,
	loading?: () => Node
) {
	const marker = new Marker();
	if (loading) marker.insert(loading());

	return (host: Bindable) => {
		host.bind(
			source.tap(item => {
				marker.empty();
				marker.insert(renderFn(item));
			})
		);

		return marker.node;
	};
}

export function each<T>(
	source: Observable<T[]>,
	renderFn: (item: T) => Node,
	empty?: () => Node
) {
	const marker = new Marker();

	return (host: Bindable) => {
		host.bind(
			source.tap(arr => {
				marker.empty();
				if (arr.length)
					for (const item of arr) marker.insert(renderFn(item));
				else if (empty) marker.insert(empty());
			})
		);

		return marker.node;
	};
}

export function Style(p: { children: Styles }) {
	return renderCSS(p.children);
}

export function Static(p: { children: NativeChildren }): any {
	return staticTemplate(() => dom(dom, undefined, p.children));
}

type AriaProperties = {
	atomic: string;
	autocomplete: string;
	busy: string;
	checked: string;
	controls: string;
	current: string;
	describedby: string;
	details: string;
	disabled: string;
	dropeffect: string;
	errormessage: string;
	expanded: string;
	flowto: string;
	grabbed: string;
	haspopup: string;
	hidden: string;
	invalid: string;
	keyshortcuts: string;
	label: string;
	labelledby: string;
	level: string;
	live: string;
	orientation: string;
	owns: string;
	placeholder: string;
	pressed: string;
	readonly: string;
	required: string;
	selected: string;
	sort: string;
	valuemax: string;
	valuemin: string;
	valuenow: string;
	valuetext: string;
	modal: string;
	multiline: string;
	multiselectable: string;
	relevant: string;
	roledescription: string;
};

type AriaProperty = keyof AriaProperties;

export function aria<T extends Component>(prop: AriaProperty, value: string) {
	return (ctx: T) =>
		ctx.bind(observable(() => ctx.setAttribute(`aria-${prop}`, value)));
}

export function ariaValue(host: Element, prop: AriaProperty) {
	return tap<string | number>(val =>
		host.setAttribute('aria-' + prop, val.toString())
	);
}

export function ariaProp(host: Element, prop: AriaProperty) {
	return tap<boolean>(val =>
		host.setAttribute('aria-' + prop, val ? 'true' : 'false')
	);
}

export function ariaChecked(host: ValueElement) {
	return tap<boolean>(val =>
		host.setAttribute(
			'aria-checked',
			host.value === undefined ? 'mixed' : val ? 'true' : 'false'
		)
	);
}
