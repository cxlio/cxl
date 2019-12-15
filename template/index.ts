import {
	merge,
	tap,
	map,
	filter,
	Subscription,
	Observable,
	Subject,
	operator
} from '../rx';
import {
	setContent as domSetContent,
	on,
	trigger,
	AttributeObserver,
	MutationEvent
} from '../dom';
import { ElementMap, BindingFunction } from './jsx';

export type RenderFunction = (view?: View) => Element;

interface AnchorEvent {
	anchorName: string;
	element: Element;
}

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

export function triggerEvent(element: Element, event: string) {
	return tap(val => trigger(element, event, val));
}

export function setAttribute(attribute: string, el: Element) {
	return tap(val => ((el as any)[attribute] = val));
}

export function keypress(el: Element, key?: string) {
	return on(el, 'keypress').pipe(
		filter((ev: KeyboardEvent) => !key || ev.key.toLowerCase() === key)
	);
}

export function appendChild<T extends Element>(el: T) {
	return tap<Element>(node => {
		el.appendChild(node);
	});
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

const anchorSubject = new Subject<AnchorEvent>();

export function anchor(name: string) {
	return anchorSubject.pipe(filter(ev => ev.anchorName === name));
}

export function sendToAnchor(anchorName: string, element: Element) {
	anchorSubject.next({ anchorName, element });
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

let domContext: View;

function createBinding<T>(el: T, fn: BindingFunction<T>) {
	domContext.addBinding(typeof fn === 'function' ? fn(el) : fn);
}

export function dom<T extends keyof HTMLElementTagNameMap>(
	tagName: T,
	attributes?: Partial<HTMLElementTagNameMap[T]>,
	...children: (string | Element)[]
): HTMLElementTagNameMap[T];
export function dom<T extends HTMLElement>(
	tagName: string,
	attributes?: Partial<TemplateElement<T>>,
	...children: (string | Element)[]
): T {
	const result = document.createElement(tagName as any);

	for (let i in attributes)
		if (i === '$') {
			createBinding(
				result,
				attributes.$ as BindingFunction<ElementMap[T]>
			);
		} else (result as any)[i] = (attributes as any)[i];

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
