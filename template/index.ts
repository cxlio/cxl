import {
	AttributeObserver,
	getShadow,
	setContent as domSetContent,
	on,
	onAction,
	trigger,
} from '../dom/index.js';
import {
	EMPTY,
	Observable,
	Operator,
	Subscription,
	concat,
	debounceTime,
	defer,
	filter,
	map,
	merge,
	of,
	switchMap,
	tap,
} from '../rx/index.js';
import {
	Component,
	pushRender,
	registerComponent,
} from '../component/index.js';
import type { Binding, RenderContext } from '../xdom/index.js';

interface ElementWithValue<T> extends HTMLElement {
	value: T;
}

export function getAttribute<T extends Node, K extends keyof T>(
	el: T,
	name: K
) {
	const view: any = (el as any).view;
	const observer = view
		? view.attributes$.pipe(filter((ev: any) => ev.attribute === name))
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
	}
}

Observable.prototype.log = function () {
	return this.pipe(LOG);
};

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

type Pipe<ElementT, HostT> = (
	el: ElementT,
	ctx: HostT
) => void | Observable<any>;

interface Sources<H> {
	get<E, K extends keyof H>(attr: K, cb?: Pipe<E, H>): Binding<E, H, H[K]>;
	onAction<E extends Element>(cb?: Pipe<E, H>): Binding<E, H>;
	on<E extends Element>(ev: string, cb?: Pipe<E, H>): Binding<E, H>;
	call<E>(method: keyof H, cb?: Pipe<E, H>): Binding<E, H>;
}

function chain<T, T2>(source: Binding<T, T2>, pipe?: Pipe<T, T2>) {
	const result = pipe
		? (el: T, ctx: T2) =>
				source(el, ctx).pipe(switchMap(() => pipe(el, ctx) || EMPTY))
		: source;
	(result as any).cxlBinding = true;
	return result;
}

const sources: Sources<any> = {
	get: (attr, pipe) => chain((_el, ctx) => getAttribute(ctx, attr), pipe),
	onAction: pipe => chain(el => onAction(el), pipe),
	on: (ev, pipe) => chain(el => on(el, ev), pipe),
	call: (method, pipe) => chain((_e, ctx) => ctx.host[method](), pipe),
};

export function tpl<HostT>(fn: (helper: Sources<HostT>) => Renderable<HostT>) {
	return fn(sources as Sources<HostT>);
}

interface TemplateSources<T> {
	get<K extends keyof T>(attr: K): Observable<T[K]>;
}

let templateContext: any;

const templateSources: TemplateSources<any> = {
	get(attr) {
		return defer(() => {
			return getAttribute(templateContext, attr);
		});
	},
};

type Renderable<T> = (ctx: T) => Element;
type TemplateFn<T> = (sources: TemplateSources<T>) => Renderable<T>;

export function Template<T extends Component>(
	tagName: string,
	tplFn: TemplateFn<T>
) {
	return (ctor: any) => {
		const tpl = tplFn(templateSources);
		registerComponent(tagName, ctor);
		pushRender(ctor.prototype, node => {
			const oldContext = templateContext;
			node.bind(
				defer(() => {
					templateContext = node;
				})
			);
			const result = tpl(node);
			node.bind(
				defer(() => {
					templateContext = oldContext;
				})
			);

			if (result !== node) getShadow(node).appendChild(result);
		});
	};
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
	private subscriptions?: Subscription[];

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
	return (ctx: RenderContext) => {
		const marker = new Marker();
		const context = new Context(ctx);

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
