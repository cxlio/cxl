import {
	Observable,
	merge,
	tap,
	map,
	filter,
	concat,
	debounceTime,
	of,
	defer
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
	const view: any = (el as any).view;
	const observer = view
		? view.attributes$.pipe(filter((ev: any) => ev.attribute === name))
		: new AttributeObserver(el).pipe(filter(ev => ev.value === name));
	return concat(
		defer(() => of(el[name])),
		observer.pipe(map(() => el[name]))
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

type SourceFn = (el: any, host: any) => Observable<any>;

class Chain<T extends HTMLElement, ElementT> {
	pipes: any[] = [];
	constructor(public source: SourceFn) {}

	push(op: any) {
		this.pipes.push(op);
	}

	set(attr: keyof T) {
		this.push((el: any) => (el[attr] = el));
	}

	toBinding(): (el: ElementT, host: T) => Observable<any> {
		return this.source;
	}
}

interface Sources<T extends HTMLElement, T2> {
	get(attr: keyof T): Chain<T, T2>;
	call(method: keyof T): Chain<T, T2>;
	onAction(method?: keyof T): Chain<T, T2>;
	on(ev: string): Chain<T, T2>;
}

const sources: Sources<any, any> = {
	get(attr) {
		return new Chain((_el, host) => getAttribute(host.host, attr));
	},
	call(method) {
		return new Chain((_el, host) => (host.host[method] as any)());
	},
	onAction(method?) {
		return new Chain((el, host) =>
			onAction(el).pipe(tap(ev => method && host.host[method](ev)))
		);
	},
	on: ev => new Chain(el => on(el, ev))
};

interface RenderContext<T> {
	host: T;
	bind(binding: Observable<any>): void;
}
type Renderable<T> = (ctx: RenderContext<T>) => any;

export function tpl<T extends HTMLElement, T2 = any>(
	fn: (helper: Sources<T, T2>) => Renderable<T>
) {
	return fn(sources as Sources<T, T2>);
}
