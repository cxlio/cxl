import { Subscription, Observable, Operator, of } from '../rx';

type AttributeType<T> = {
	[P in keyof T]?: T[P] | Observable<T[P]> | Operator<T, any>;
} & {
	$?: (el: T) => Observable<any>;
};
type RenderFunction<T> = (node: T) => void;
type DecoratorResult<T extends JSXComponent> =
	| JSXElement<T>
	| T
	| RenderFunction<T>;
type Decorator<T extends JSXComponent> = (
	constructor: new () => T
) => DecoratorResult<T> | void;
type Augmentation<T extends JSXComponent> = JSXElement<T> | Decorator<T> | T;

class ComponentView<T extends Component> {
	bindings?: Binding<T, any>[];
	subscription?: Subscription<T>;
	compiledBindings?: Observable<T>;

	constructor(private node: T) {}

	addBinding(binding: Binding<T>) {
		if (!this.bindings) this.bindings = [];
		this.bindings.push(binding);
	}

	connect() {
		if (this.bindings) {
			if (!this.compiledBindings) {
				this.compiledBindings = of(this.node).pipe(...this.bindings);
			}
			this.subscription = this.compiledBindings.subscribe();
		}
	}

	disconnect() {
		if (this.subscription) this.subscription.unsubscribe();
	}
}

export class Component extends HTMLElement {
	static observedAttributes: string[];

	view = new ComponentView(this);
	jsxAttributes?: AttributeType<this>;
	attributes$ = new Subject<AttributeEvent<this>>();

	constructor() {
		super();
		this.render(this);
	}

	protected connectedCallback() {
		if (this.view) this.view.connect();
	}

	protected disconnectedCallback() {
		if (this.view) this.view.disconnect();
	}

	render(_el: this) {
		// TODO
	}

	get host(): Element | null {
		const root = this.getRootNode();
		return root instanceof ShadowRoot ? root.host : null;
	}

	attributeChangedCallback(name: keyof this, oldValue: any, value: any) {
		if (oldValue !== value) this[name] = value;
	}
}

function pushRender<T>(proto: T, renderFn: RenderFunction<T>) {
	const oldRender = (proto as any).render;
	(proto as any).render = function(el: any) {
		oldRender(el);
		renderFn(el);
	};
}

function getShadow(el: HTMLElement) {
	return el.shadowRoot || el.attachShadow({ mode: 'open' });
}

export function Augment<T>(...decorators: Augmentation<T>[]) {
	return (constructor: new () => T) => decorate(constructor, decorators);
}

interface AttributeOptions {
	persist: boolean;
	observe: boolean;
}

function getObservedAttributes(target: typeof Component) {
	let result = target.observedAttributes;

	if (result && !target.hasOwnProperty('observedAttributes'))
		result = target.observedAttributes.slice(0);

	return (target.observedAttributes = result || []);
}

interface AttributeEvent<T> {
	type: 'changed';
	target: T;
	attribute: string;
	value: any;
}

function attributeOperator(source: Observable<AttributeEvent<HTMLElement>>) {
	return new Observable(() => {
		const subscription = source.subscribe(
			({ value, target, attribute }) => {
				if (value === false && target.hasAttribute(attribute))
					target.removeAttribute(name);
				else if (typeof value === 'string')
					target.setAttribute(attribute, value);
				else if (value === true) target.setAttribute(attribute, '');
			}
		);

		return () => subscription.unsubscribe();
	});
}

export function Attribute<T extends Component>(
	options?: Partial<AttributeOptions>
) {
	return (target: T, attribute: string, descriptor?: PropertyDescriptor) => {
		const ctor = target.constructor as typeof Component;
		const prop = '$$' + name;
		const attributes = getObservedAttributes(ctor);

		attributes.push(name);

		if (descriptor) Object.defineProperty(target, prop, descriptor);

		if (options?.persist)
			bind(node => node.attributes$.pipe(attributeOperator));

		if (options?.observe)
			Object.defineProperty(target, attribute, {
				get() {
					return this[prop];
				},
				set(value: any) {
					this.attributes$.next({ attribute, value });
					return (this[prop] = value);
				}
			});
	};
}

export function StyleAttribute() {
	return (target: any, name: string, descriptor?: PropertyDescriptor) => {
		const prop = '$$' + name;
		const ctor = target.constructor;
		const attributes =
			ctor.observedAttributes || (ctor.observedAttributes = []);
		attributes.push(name);

		if (descriptor) Object.defineProperty(target, prop, descriptor);

		Object.defineProperty(target, name, {
			get() {
				return this[prop];
			},
			set(newValue: any) {
				const has = this.hasAttribute(name);
				if (newValue === '' || newValue === true) {
					if (!has) this.setAttribute(name, '');
				} else if (has) this.removeAttribute(name);
				return (this[prop] = newValue);
			}
		});
	};
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

export function getRegisteredComponents() {
	return { ...registeredComponents };
}

export function register(tagName: string) {
	return (constructor: any) => {
		registeredComponents[tagName] = constructor;
		(constructor as any).tagName = tagName;
		customElements.define(tagName, constructor as any);
	};
}

interface MutationEvent<T, ValueT> {
	type: 'added' | 'removed' | 'changed';
	target: T;
	value: ValueT;
}

export class ChildrenObserver<T extends HTMLElement> extends Subject<
	MutationEvent<T, Node>
> {
	private observer?: MutationObserver;

	constructor(private element: T) {
		super();
	}

	$handleEvent(ev: MutationRecord) {
		const target = this.element;

		for (const value of ev.addedNodes)
			this.next({ type: 'added', target, value });
		for (const value of ev.removedNodes)
			this.next({ type: 'removed', target, value });
	}

	protected onSubscribe(subscription: any) {
		const el = this.element;

		if (!this.observer) {
			this.observer = new MutationObserver(events =>
				events.forEach(this.$handleEvent, this)
			);
			if (el) this.observer.observe(el, { childList: true });
		}

		if (el)
			for (const node of el.childNodes)
				subscription.next({ type: 'added', target: el, value: node });

		return super.onSubscribe(subscription);
	}

	unsubscribe() {
		if (this.subscriptions.size === 0 && this.observer)
			this.observer.disconnect();
	}

	destroy() {
		if (this.observer) this.observer.disconnect();
	}
}
@Augment(register('cxl-div'))
export class Div extends Component {}

@Augment(register('cxl-span'))
export class Span extends Component {}

@Augment(register('cxl-slot'))
export class Slot extends Component {
	static observedAttributes = ['selector'];
	managedSlot?: HTMLSlotElement;
	$selector = '';

	get selector() {
		return this.$selector;
	}

	set selector(val: string) {
		this.$selector = val;
		this.updateSlot();
	}

	private getSlot() {
		return (
			this.managedSlot ||
			(this.managedSlot = document.createElement('slot'))
		);
	}

	private updateSlot() {
		const selector = this.$selector;
		const slot = this.getSlot();
		const host = this.host;

		slot.name = selector;

		if (selector && host) {
			const observer = new ChildrenObserver(this);
			this.view.addBinding(
				switchMap(() => observer.pipe(tap(ev => this.handleEvent(ev))))
			);

			for (const node of host.children)
				if (node.matches(selector)) node.slot = selector;
		}

		return slot;
	}

	private handleEvent(ev: MutationEvent<HTMLElement, Node>) {
		const node = ev.value,
			selector = this.$selector;
		if (
			ev.type === 'added' &&
			node instanceof HTMLElement &&
			node.matches(selector)
		)
			node.slot = selector;
	}

	connectedCallback() {
		super.connectedCallback();
		const slot = this.updateSlot();
		if (!slot.parentNode) {
			this.appendChild(slot);
		}
	}
}

function cloneElement(proto: any, el: Node) {
	pushRender(proto, node => getShadow(node).appendChild(el.cloneNode(true)));
}

function renderTemplate(proto: any, tpl: JSXElement) {
	pushRender(proto, node => getShadow(node).appendChild(render(tpl)));
}

export function template(templateFn: (node: any) => JSXElement) {
	return () => (node: any) => {
		getShadow(node).appendChild(render(templateFn(node)));
	};
}
function doRender(proto: any, renderFn: DecoratorResult<any>) {
	if (renderFn instanceof JSXElement) return renderTemplate(proto, renderFn);
	if (renderFn instanceof Node) return cloneElement(proto, renderFn);

	pushRender(proto, renderFn);
}

export function decorate<T>(
	constructor: new () => T,
	decorators: Augmentation<T>[]
) {
	const proto = constructor.prototype;
	for (const d of decorators) {
		const renderFn = typeof d === 'function' ? d(constructor) : d;
		if (renderFn) doRender(proto, renderFn);
	}
}
