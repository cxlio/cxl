import {
	BehaviorSubject,
	Observable,
	Operator,
	Subscription,
	be,
	filter,
	map,
	merge,
	tap,
	concat,
	debounceTime,
	of,
	defer,
	switchMap,
	EMPTY,
} from '../rx/index.js';
import {
	setContent as domSetContent,
	on,
	trigger,
	AttributeObserver,
} from '../dom/index.js';

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

export function onValue<T extends ElementWithValue<R>, R = T['value']>(el: T) {
	return merge(on(el, 'input'), on(el, 'change')).pipe(
		map(ev => (ev.target as T).value),
		debounceTime()
	);
}

export function onHashChange() {
	return concat(
		of(location.hash.slice(1)),
		on(window, 'hashchange').pipe(map(() => location.hash.slice(1)))
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
		on(window, 'popstate').pipe(tap(() => history.state)),
		pushSubject
	);
}

export function setContent(el: Element) {
	return tap((val: any) => domSetContent(el, val));
}

const LOG = tap(val => console.log(val));
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
	portals.get(portalName)?.appendChild(el);
}

interface RenderContext<T> {
	host: T;
	bind(binding: Observable<any>): void;
}

type Pipe<ElementT, HostT> = (
	el: ElementT,
	ctx: RenderContext<HostT>
) => void | Observable<any>;
type Binding<T, T2> = (el: T, ctx: RenderContext<T2>) => Observable<any>;

interface Sources<H, E> {
	get(attr: keyof H, cb?: Pipe<E, H>): Binding<E, H>;
	onAction(cb?: Pipe<E, H>): Binding<E, H>;
	on(ev: string, cb?: Pipe<E, H>): Binding<E, H>;
	call(method: keyof H, cb?: Pipe<E, H>): Binding<E, H>;
}

function chain<T, T2>(source: Binding<T, T2>, pipe?: Pipe<T, T2>) {
	const result = pipe
		? (el: T, ctx: RenderContext<T2>) =>
				source(el, ctx).pipe(switchMap(() => pipe(el, ctx) || EMPTY))
		: source;
	(result as any).cxlBinding = true;
	return result;
}

const sources: Sources<any, any> = {
	get: (attr, pipe) =>
		chain((_el, ctx) => getAttribute(ctx.host, attr), pipe),
	onAction: pipe => chain(el => onAction(el), pipe),
	on: (ev, pipe) => chain(el => on(el, ev), pipe),
	call: (method, pipe) => chain((_e, ctx) => ctx.host[method](), pipe),
};

type Renderable<T> = (ctx: RenderContext<T>) => any;

export function tpl<ElementT, HostT extends HTMLElement>(
	fn: (helper: Sources<HostT, ElementT>) => Renderable<HostT>
) {
	return fn(sources as Sources<HostT, ElementT>);
}

enum ListOperation {
	Insert,
	Empty,
}

interface InsertEvent<T> {
	type: ListOperation.Insert;
	item: T;
}
interface EmptyEvent {
	type: ListOperation.Empty;
}

export type ListEvent<T> = InsertEvent<T> | EmptyEvent;

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

class Context {
	private bindings: Observable<any>[] = [];
	private subscriptions?: Subscription<any>[];

	constructor(public host: any) {}

	connect() {
		if (this.subscriptions) throw new Error('Attempting to connect twice');
		this.subscriptions = this.bindings.map(b => b.subscribe());
	}

	disconnect() {
		this.subscriptions?.forEach(s => s.unsubscribe());
	}

	bind(b: Observable<any>) {
		this.bindings.push(b);
		if (this.subscriptions) this.subscriptions.push(b.subscribe());
	}

	reset() {
		this.disconnect();
		this.subscriptions = undefined;
		this.bindings.length = 0;
	}
}

export function list<T>(
	source: Observable<T[]>,
	renderFn: (item: T) => Renderable<any>
) {
	return (ctx: RenderContext<any>) => {
		const marker = new Marker();
		const context = new Context(ctx.host);

		ctx.bind(
			new Observable<void>(() => {
				const unsub = source.subscribe(ary => {
					marker.empty();
					context.reset();
					ary.forEach(item => marker.insert(renderFn(item)(context)));
					context.connect();
				});

				return () => {
					unsub.unsubscribe();
					context.disconnect();
				};
			})
		);

		return marker.node;
	};
}
