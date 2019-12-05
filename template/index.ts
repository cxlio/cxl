import {
	merge,
	tap,
	map,
	filter,
	Subscription,
	Observable,
	operator
} from '../rx';
import { setContent as domSetContent, on, AttributeObserver } from '../dom';

export type RenderFunction = (view?: View) => Element;
export type Binding = Observable<any>;

export class View {
	private bindings: Observable<any>[] = [];
	private subscriptions?: Subscription<any>[];
	private connected = false;

	protected subscriber: any;

	addBinding(binding: Observable<any> | Observable<any>[]) {
		if (Array.isArray(binding)) binding.forEach(b => this.addBinding(b));
		else {
			this.bindings.push(binding);

			if (this.connected && this.subscriptions)
				this.subscriptions.push(binding.subscribe(this.subscriber));
		}
	}

	connect() {
		if (this.connected) return;
		this.connected = true;
		this.subscriptions = this.bindings.map(b =>
			b.subscribe(this.subscriber)
		);
	}

	disconnect() {
		if (!this.connected) return;
		if (this.subscriptions)
			this.subscriptions.forEach(b => b.unsubscribe());
		this.subscriptions = undefined;
		this.connected = false;
	}
}

export function getAttribute(attribute: string, el: Element) {
	const observer = new AttributeObserver(el);
	return observer.pipe(
		filter(ev => ev.value === attribute),
		map(() => (el as any)[attribute])
	);
}

export function keypress(el: Element, key?: string) {
	return on(el, 'keypress').pipe(
		filter((ev: KeyboardEvent) => !key || ev.key.toLowerCase() === key)
	);
}

export function onAction(el: Element) {
	return merge(on(el, 'click'));
}

export function value(el: Element) {
	return on(el, 'input').pipe(map(ev => ev.target.value));
}

export function location() {
	return on(window, 'hashchange').pipe(map(() => window.location.hash));
}

export type BindingFunction = (el?: Element) => Observable<any>;

interface Attributes {
	$?: BindingFunction;
	[k: string]: any;
}

export function setContent(el: Element = domElement) {
	return operator(
		(subscriber: Subscription<string | Node>) => (val: string | Node) => {
			domSetContent(el, val);
			subscriber.next(val);
		}
	);
}

export function log() {
	return tap(val => console.log(val));
}

let domContext: View, domElement: Element;

function createBinding(el: Element, fn: BindingFunction) {
	domContext.addBinding(typeof fn === 'function' ? fn(el) : fn);
}

export function dom(
	tagName: string,
	attributes?: Attributes,
	...children: (string | Element)[]
): Element {
	const result = (domElement = document.createElement(tagName));

	for (let i in attributes)
		if (i === '$') {
			createBinding(result, attributes.$ as any);
		} else (result as any)[i] = attributes[i];

	if (children.length)
		children.forEach((child: any) => {
			child =
				typeof child === 'string'
					? document.createTextNode(child)
					: child;
			result.appendChild(child);
		});

	return result;
}

export function render(renderFn: RenderFunction) {
	const view = new View(),
		oldContext = domContext;
	domContext = view;
	const el = renderFn(view);
	domContext = oldContext;

	return new Observable<Element>(subs => {
		view.connect();
		subs.next(el);
		return view.disconnect();
	});
}
