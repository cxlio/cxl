import {
	Subscription,
	Observable,
	Subject,
	Operator,
	concat,
	defer,
	filter,
	of,
	map,
	merge,
	tap
} from '../rx/index.js';
import { ChildrenObserver, MutationEvent, getShadow } from '../dom/index.js';

export interface RenderContext<T = HTMLElement> {
	host: T;
	bind(binding: Binding<any>): void;
}
type Binding<T> = Observable<T>;
type Renderable<T = HTMLElement> = (ctx: RenderContext<T>) => Node;
type RenderFunction<T> = (node: T) => void;
type Augmentation<T> = (view: ComponentView<T>) => Node | void;

type HTMLAttributes<T> = {
	[P in Exclude<keyof T, 'children'>]?:
		| T[P]
		| Observable<T[P]>
		| Operator<T, any>;
};
type AttributeType<T> =
	| HTMLAttributes<T>
	| {
			$?: (el: T) => Observable<any>;
			children?: any;
	  };

const registeredComponents: Record<string, typeof Component> = {};

export class ComponentView<T> {
	private bindings?: Binding<any>[];
	private subscription?: Subscription<any>;
	attributes$ = new Subject<AttributeEvent<T>>();

	constructor(public host: T) {}

	bind(binding: Binding<any>) {
		if (this.subscription)
			throw new Error('Cannot bind when view is connected');

		if (!this.bindings) this.bindings = [];
		this.bindings.push(binding);
	}

	connect() {
		if (this.bindings && !this.subscription)
			this.subscription = merge(...this.bindings).subscribe({
				error(e) {
					throw e;
				}
			});
	}

	disconnect() {
		if (this.subscription) {
			this.subscription.unsubscribe();
			this.subscription = undefined;
		}
	}
}

export class Component extends HTMLElement {
	static tagName: string;
	static observedAttributes: string[];
	static create() {
		return document.createElement(this.tagName);
	}

	jsxAttributes?: AttributeType<this>;
	view = new ComponentView(this);

	constructor() {
		super();
		this.render(this);
	}

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

function pushRender<T>(proto: T, renderFn: RenderFunction<T>) {
	const oldRender = (proto as any).render;
	(proto as any).render = function(el: T) {
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

export function Augment<T>(...augmentations: Augmentation<T>[]) {
	return (ctor: new () => T) => {
		const tagName = (ctor as any).tagName;
		if (tagName) registerComponent(tagName, ctor);
		augment(ctor, augmentations);
	};
}

export function render<T extends Component>(renderFn: (node: T) => Renderable) {
	return (view: ComponentView<T>) => {
		const node = view.host,
			child = renderFn(node)(view);
		if (child !== node) getShadow(node).appendChild(child);
	};
}

export function bind<T extends Component>(
	bindFn: (node: T) => Observable<any>
) {
	return (view: ComponentView<T>) => view.bind(bindFn(view.host));
}

export function connect<T extends Component>(bindFn: (node: T) => void) {
	return (view: ComponentView<T>) =>
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

/**
 * Fires when connected and on attribute change
 */
export function update<T extends Component>(fn: (node: T) => void) {
	return (view: ComponentView<T>) =>
		view.bind(
			concat(of(view.host), view.attributes$).pipe(
				tap(() => fn(view.host))
			)
		);
}

export function get<T extends Component, K extends keyof T>(
	element: T,
	attribute: K
): Observable<T[K]> {
	return concat(
		defer(() => of(element[attribute])),
		element.view.attributes$.pipe(
			filter(ev => ev.attribute === attribute),
			map(() => element[attribute])
		)
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
			pushRender(target, (node: Component) =>
				node.view.bind(
					concat(
						defer(() =>
							of({
								attribute,
								target: node,
								value: (node as any)[attribute]
							})
						),
						node.view.attributes$.pipe(
							filter(ev => ev.attribute === attribute)
						)
					).pipe(options.persistOperator || attributeOperator)
				)
			);

		Object.defineProperty(target, attribute, {
			get() {
				return this[prop];
			},
			set(value: any) {
				this[prop] = value;
				this.view.attributes$.next({ target: this, attribute, value });
				return value;
			}
		});
	};
}

export function StyleAttribute() {
	return Attribute({
		persist: true,
		observe: true
	});
}

export function getRegisteredComponents() {
	return { ...registeredComponents };
}

export function role<T>(roleName: string) {
	return (view: ComponentView<T>) =>
		view.bind(
			defer(() => {
				const el = view.host as any;
				!el.hasAttribute('role') && el.setAttribute('role', roleName);
			})
		);
}
