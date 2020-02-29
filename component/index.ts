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
} from '../rx';
import { ChildrenObserver, MutationEvent } from '../dom';

interface RenderContext {
	host: HTMLElement;
	bind(binding: Binding<any>): void;
}
type Binding<T> = Observable<T>;
type Renderable = (ctx?: RenderContext) => Node;
type RenderFunction<T> = (node: T) => void;
type Decorator<T> = (constructor: new () => T) => RenderFunction<T> | void;
type Augmentation<T> = Decorator<T>;
type AttributeType<T> =
	| ({
			[P in keyof T]?: T[P] | Observable<T[P]> | Operator<T, any>;
	  } & {
			$?: (el: T) => Observable<any>;
	  })
	| {
			children?: any;
	  };

class ComponentView<T extends Component> {
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
		if (oldValue !== value) this[name] = value;
	}
}

function getShadow(el: HTMLElement) {
	return el.shadowRoot || el.attachShadow({ mode: 'open' });
}

function pushRender<T>(proto: T, renderFn: RenderFunction<T>) {
	const oldRender = (proto as any).render;
	(proto as any).render = function(el: any) {
		if (oldRender) oldRender(el);
		renderFn(el);
	};
}

export function augment<T>(
	constructor: new () => T,
	decorators: Augmentation<T>[]
) {
	const proto = constructor.prototype;
	for (const d of decorators) {
		const renderFn = d(constructor);
		if (renderFn) pushRender(proto, renderFn);
	}
}

export function Augment<T>(...augmentations: Augmentation<T>[]) {
	return (ctor: new () => T) => augment(ctor, augmentations);
}

export function template(template: Renderable) {
	return () => (node: any) => {
		getShadow(node).appendChild(template(node.view));
	};
}

export function render<T extends Component>(renderFn: (node: T) => Renderable) {
	return () => (node: T) => {
		getShadow(node).appendChild(renderFn(node)(node.view));
	};
}

export function bind<T extends Component>(
	bindFn: (node: T) => Observable<any>
) {
	return () => (node: T) => {
		const binding = bindFn(node);
		node.view.bind(binding);
	};
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

function attributeOperator<T extends HTMLElement>() {
	return tap<AttributeEvent<T>>(({ value, target, attribute }) => {
		if (
			(value as any) === false &&
			target.hasAttribute(attribute as string)
		)
			target.removeAttribute(name);
		else if (typeof value === 'string')
			target.setAttribute(attribute as string, value);
		else if ((value as any) === true)
			target.setAttribute(attribute as string, '');
	});
}

export function Attribute(options?: Partial<AttributeOptions>) {
	return (
		target: any,
		attribute: string,
		descriptor?: PropertyDescriptor
	) => {
		const ctor = target.constructor as typeof Component;
		const prop = '$$' + attribute;
		const attributes = getObservedAttributes(ctor);

		attributes.push(attribute);

		if (descriptor) Object.defineProperty(target, prop, descriptor);

		if (options?.persist)
			pushRender(
				target,
				bind(node =>
					node.view.attributes$.pipe(
						options.persistOperator || attributeOperator()
					)
				)()
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

export function mixin<A, B, C, D, E, F>(
	a: new () => A,
	b?: new () => B,
	c?: new () => C,
	d?: new () => D,
	e?: new () => E,
	f?: new () => F
): new () => A & B & C & D & E & F & Component;
export function mixin(...mixins: any[]) {
	const init: any[] = [];

	class Result extends Component {
		constructor() {
			super();
			for (const i of init) Object.assign(this, i);
		}
	}

	for (const m of mixins) {
		const properties = Object.getOwnPropertyDescriptors(m.prototype);
		delete properties.constructor;
		init.push(new m());
		Object.defineProperties(Result.prototype, properties);
	}

	return Result;
}

const registeredComponents: Record<string, typeof Component> = {};

export function register(tagName: string) {
	return (ctor: any) => {
		if (!ctor.tagName) ctor.tagName = tagName;
		registeredComponents[tagName] = ctor;
		customElements.define(tagName, ctor);
	};
}

export function getRegisteredComponents() {
	return { ...registeredComponents };
}

export function Host({
	children
}: {
	children: Renderable | Renderable[];
}): Renderable {
	return (ctx?: RenderContext) => {
		if (Array.isArray(children)) {
			const fragment = document.createDocumentFragment();
			children.forEach(c => fragment.appendChild(c(ctx)));
			return fragment;
		}
		return children(ctx);
	};
}

export function getAttribute<T extends Component, K extends keyof T>(
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
