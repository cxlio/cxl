import {
	Observable,
	merge,
	tap,
	map,
	filter,
	concat,
	debounceTime,
	of
} from '../rx/index.js';
import {
	setContent as domSetContent,
	on,
	trigger,
	AttributeObserver,
	MutationEvent
} from '../dom/index.js';

export function $on(event: string, callback: (ev: Event) => void) {
	return (el: HTMLElement) => on(el, event).pipe(tap(callback));
}

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

export function triggerEvent<T extends Element, R>(element: T, event: string) {
	return tap<R>((val: R) => trigger(element, event, val));
}

export function setAttribute(el: Element, attribute: string) {
	return tap(val => ((el as any)[attribute] = val));
}

export function keypress(el: Element, key?: string) {
	return on(el, 'keypress').pipe(
		filter((ev: KeyboardEvent) => !key || ev.key.toLowerCase() === key)
	);
}

export function onAction(el: Element) {
	return merge(on(el, 'click'), keypress(el, 'enter'));
}

interface ElementWithValue<T> extends HTMLElement {
	value: T;
}

export function value<R, T extends ElementWithValue<R>>(el: T) {
	return merge(on(el, 'input'), on(el, 'change')).pipe(
		debounceTime(),
		map(ev => (ev.target as T).value)
	);
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

export const log = tap(val => console.log(val));

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
