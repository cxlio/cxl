import type { AttributeType, RenderContext } from '../xdom/index.js';
import { ChildrenObserver, MutationEvent, getShadow } from '../dom/index.js';
import {
	Observable,
	Operator,
	Subject,
	Subscription,
	concat,
	defer,
	filter,
	map,
	of,
	tap,
} from '../rx/index.js';

type Renderable<T = HTMLElement> = (ctx: RenderContext<T>) => Node;
type RenderFunction<T> = (node: T) => void;
type Augmentation<T> = (context: RenderContext<T>) => Node | void;

const registeredComponents: Record<string, typeof Component> = {};
const subscriber = {
	error(e: any) {
		throw e;
	},
};

export class ComponentView<T> {
	private bindings?: Observable<any>[];
	private subscriptions?: Subscription<any>[];
	private rendered = false;
	private connected = false;
	attributes$ = new Subject<AttributeEvent<T>>();

	constructor(public host: T, private render: (host: T) => void) {}

	bind(binding: Observable<any>) {
		if (this.connected)
			throw new Error('Cannot add bindings to a connected view');

		if (!this.bindings) this.bindings = [];
		this.bindings.push(binding);
	}

	connect() {
		if (!this.rendered) {
			this.render(this.host);
			this.rendered = true;
		}

		if (!this.connected) {
			this.connected = true;

			if (this.bindings)
				this.subscriptions = this.bindings.map(b =>
					b.subscribe(subscriber)
				);
		}
	}

	disconnect() {
		if (this.subscriptions) {
			this.subscriptions.forEach(s => s.unsubscribe());
			this.subscriptions = undefined;
		}
		this.connected = false;
	}
}

export abstract class Component extends HTMLElement {
	static tagName: string;
	static observedAttributes: string[];
	static create() {
		return document.createElement(this.tagName);
	}

	// EventMap
	eventMap?: any;
	jsxAttributes?: AttributeType<this>;
	view = new ComponentView(this, this.render);

	render(_node: this) {
		// TODO
	}

	connectedCallback() {
		this.view.connect();
	}

	disconnectedCallback() {
		this.view.disconnect();
	}

	attributeChangedCallback(name: keyof this, oldValue: any, value: any) {
		if (oldValue !== value) {
			const actualValue =
				value === '' ? true : value === null ? false : value;
			this[name] = actualValue;
		}
	}
}

export function pushRender<T>(proto: T, renderFn: RenderFunction<T>) {
	const oldRender = (proto as any).render;
	(proto as any).render = function (el: T) {
		if (oldRender) oldRender(el);
		renderFn(el);
	};
}

export function augment<T>(
	constructor: new () => T,
	decorators: Augmentation<T>[]
) {
	pushRender(constructor.prototype, node => {
		for (const d of decorators) {
			const result = d(node.view);
			if (result instanceof Node && result !== node)
				getShadow(node).appendChild(result);
		}
	});
}

export function registerComponent(tagName: string, ctor: any) {
	if (!ctor.tagName) ctor.tagName = tagName;
	registeredComponents[tagName] = ctor;
	customElements.define(tagName, ctor);
}

export function Augment<T>(): (ctor: new () => T) => void;
export function Augment<T>(
	...augs: [string | Augmentation<T>, ...Augmentation<T>[]]
): (ctor: new () => T) => void;
export function Augment(...augs: any[]) {
	return (ctor: any) => {
		let newAugs: any, tagName: string;

		if (augs && typeof augs[0] === 'string') {
			tagName = augs[0];
			newAugs = augs.slice(1);
		} else {
			newAugs = augs;
			tagName = (ctor as any).tagName;
		}

		if (tagName) registerComponent(tagName, ctor);
		augment(ctor, newAugs);
	};
}

export function render<T extends Component>(renderFn: (node: T) => Renderable) {
	return (view: RenderContext<T>) => {
		const node = view.host,
			child = renderFn(node)(view);
		if (child !== node) getShadow(node).appendChild(child);
	};
}

export function bind<T extends Component>(
	bindFn: (node: T) => Observable<any>
) {
	return (view: RenderContext<T>) => view.bind(bindFn(view.host));
}

export function connect<T extends Component>(bindFn: (node: T) => void) {
	return (view: RenderContext<T>) =>
		view.bind(
			defer(() => {
				bindFn(view.host);
			})
		);
}

export function Slot({ selector }: { selector?: string }) {
	function handleEvent(ev: MutationEvent) {
		const node = ev.value;
		if (
			ev.type === 'added' &&
			selector &&
			node instanceof HTMLElement &&
			node.matches(selector)
		)
			node.slot = selector;
	}

	return (ctx?: RenderContext) => {
		const slot = document.createElement('slot');
		if (selector && ctx) {
			slot.name = selector;
			const observer = new ChildrenObserver(ctx.host);
			for (const node of ctx.host.children)
				if (node.matches(selector)) node.slot = selector;
			ctx.bind(observer.pipe(tap(handleEvent)));
		}

		return slot;
	};
}

export function onUpdate<T extends Component>(host: T, fn: (node: T) => void) {
	return concat(of(host), host.view.attributes$).pipe(tap(() => fn(host)));
}

/**
 * Fires when connected and on attribute change
 */
export function update<T extends Component>(fn: (node: T) => void) {
	return (view: RenderContext<T>) => view.bind(onUpdate(view.host, fn));
}

export function attributeChanged<T extends Component, K extends keyof T>(
	element: T,
	attribute: K
): Observable<T[K]> {
	return element.view.attributes$.pipe(
		filter(ev => ev.attribute === attribute),
		map(() => element[attribute])
	);
}

export function get<T extends Component, K extends keyof T>(
	element: T,
	attribute: K
): Observable<T[K]> {
	return concat(
		defer(() => of(element[attribute])),
		attributeChanged(element, attribute)
	);
}

interface AttributeOptions {
	persist: boolean;
	persistOperator: Operator<any, any>;
	observe: boolean;
}

function getObservedAttributes(target: typeof Component) {
	let result = target.observedAttributes;

	if (result && !target.hasOwnProperty('observedAttributes'))
		result = target.observedAttributes.slice(0);

	return (target.observedAttributes = result || []);
}

interface AttributeEvent<T, K extends keyof T = keyof T> {
	target: T;
	attribute: K;
	value: T[K];
}

const attributeOperator = tap<AttributeEvent<any>>(
	({ value, target, attribute }) => {
		if (value === false && target.hasAttribute(attribute))
			target.removeAttribute(attribute);
		else if (typeof value === 'string')
			target.setAttribute(attribute, value);
		else if (value === true) target.setAttribute(attribute, '');
	}
);

export function Attribute(options?: Partial<AttributeOptions>) {
	return (
		target: any,
		attribute: string,
		descriptor?: PropertyDescriptor
	) => {
		const ctor = target.constructor as typeof Component;
		const prop = '$$' + attribute;

		getObservedAttributes(ctor).push(attribute);

		if (descriptor) Object.defineProperty(target, prop, descriptor);

		if (options?.persist)
			pushRender(target, (node: Component) => {
				return node.view.bind(
					concat(
						defer(() =>
							of<AttributeEvent<any>>({
								attribute,
								target: node,
								value: (node as any)[attribute],
							})
						),
						node.view.attributes$.pipe(
							filter(ev => ev.attribute === attribute)
						)
					).pipe(options.persistOperator || attributeOperator)
				);
			});

		Object.defineProperty(target, attribute, {
			get() {
				return this[prop];
			},
			set(value: any) {
				if (this[prop] !== value) {
					this[prop] = value;
					this.view.attributes$.next({
						target: this,
						attribute,
						value,
					});
				}
			},
		});
	};
}

export function StyleAttribute() {
	return Attribute({
		persist: true,
		observe: true,
	});
}

export function getRegisteredComponents() {
	return { ...registeredComponents };
}

export function role<T>(roleName: string) {
	return (view: RenderContext<T>) =>
		view.bind(
			defer(() => {
				const el = view.host as any;
				!el.hasAttribute('role') && el.setAttribute('role', roleName);
			})
		);
}
