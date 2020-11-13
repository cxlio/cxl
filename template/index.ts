import {
	AttributeObserver,
	setContent as domSetContent,
	on,
	onChildrenMutation,
	trigger,
} from '../dom/index.js';
import {
	ListEvent,
	Observable,
	Operator,
	concat,
	debounceTime,
	defer,
	filter,
	map,
	merge,
	of,
	tap,
} from '../rx/index.js';
import { Component } from '../component/index.js';
import { bindNode } from '../tsx/index.js';

interface ElementWithValue<T> extends HTMLElement {
	value: T;
}

export function getAttribute<T extends Node, K extends keyof T>(
	el: T,
	name: K
) {
	const attr$ = (el as any).attributes$;
	const observer = attr$
		? attr$.pipe(filter((ev: any) => ev.attribute === name))
		: new AttributeObserver(el).pipe(filter(ev => ev.value === name));
	return concat<Observable<T[K]>[]>(
		defer(() => of(el[name])),
		observer.pipe(map(() => el[name]))
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

export function syncAttribute<T extends Node>(A: T, B: T, attr: keyof T) {
	return sync(
		getAttribute(A, attr),
		val => ((B as any)[attr] = val),
		getAttribute(B, attr),
		val => (A[attr] = val)
	);
}

interface NextObservable<T> extends Observable<T> {
	next(val: T): void;
}

export function model<T>(el: ElementWithValue<T>, ref: NextObservable<T>) {
	return sync(onValue(el), val => (el.value = val), ref, ref.next.bind(ref));
}

export function onValue<T extends ElementWithValue<R>, R = T['value']>(el: T) {
	return merge(on(el, 'input'), on(el, 'change')).pipe(
		map(ev => (ev.target as T).value),
		debounceTime()
	);
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

export function teleport(el: HTMLElement, portalName: string) {
	return new Observable<void>(() => {
		const placeholder = document.createTextNode('');
		el.replaceWith(placeholder);
		portals.get(portalName)?.appendChild(el);
		return () => placeholder.replaceWith(el);
	});
}

class Marker {
	private children: Node[] = [];
	node = document.createComment('marker');

	insert(content: Node, nextNode: Node = this.node) {
		this.children.push(content);
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
	return (host: Component) => {
		host.bind(
			source.tap(ev => {
				if (ev.type === 'insert') marker.insert(renderFn(ev.item));
				else if (ev.type === 'empty') marker.empty();
			})
		);
		return marker.node;
	};
}

export function each<T>(source: Observable<T[]>, renderFn: (item: T) => Node) {
	const marker = new Marker();

	return bindNode(
		marker.node,
		source.tap(arr => {
			marker.empty();
			arr.forEach(item => marker.insert(renderFn(item)));
		})
	);
}

export function slot(host: Component, selector: string) {
	return merge(
		defer(() => {
			for (const node of host.children)
				if (node.matches(selector)) node.slot = selector;
		}),
		onChildrenMutation(host).tap(ev => {
			const node = ev.value;
			if (
				ev.type === 'added' &&
				node instanceof HTMLElement &&
				node.matches(selector)
			)
				node.slot = selector;
		})
	);
}
