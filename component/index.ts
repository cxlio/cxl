///<amd-module name="@cxl/component"/>
import { AttributeType, Children, renderChildren } from '@cxl/tsx';
import { getShadow, observeChildren, setAttribute } from '@cxl/dom';
import {
	Observable,
	Operator,
	Subject,
	Subscription,
	concat,
	defer,
	filter,
	map,
	observable,
	of,
	tap,
	merge,
} from '@cxl/rx';

type RenderFunction<T> = (node: T) => void;
type Augmentation<T extends Component> = (
	host: T
) => Node | Comment | Observable<unknown> | void;
type ComponentConstructor = {
	tagName: string;
	observedAttributes: string[];
	create(): Component;
};

export type ComponentAttributeName<T> = keyof T;

export interface AttributeEvent<T> {
	target: T;
	attribute: ComponentAttributeName<T>;
	value: T[ComponentAttributeName<T>];
}

const registeredComponents: Record<string, typeof Component> = {};
const subscriber = {
	error(e: unknown) {
		throw e;
	},
};

export class Bindings {
	private subscriptions?: Subscription[];
	bindings?: Observable<unknown>[];

	bind(binding: Observable<unknown>) {
		if (this.subscriptions)
			throw new Error('Cannot bind connected component.');
		if (!this.bindings) this.bindings = [];
		this.bindings.push(binding);
	}

	connect() {
		if (!this.subscriptions && this.bindings)
			this.subscriptions = this.bindings.map(s =>
				s.subscribe(subscriber)
			);
	}
	disconnect() {
		this.subscriptions?.forEach(s => s.unsubscribe());
		this.subscriptions = undefined;
	}
}

export abstract class Component extends HTMLElement {
	static tagName: string;
	static observedAttributes: string[];
	static create(): Component {
		if (!this.tagName) throw new Error('tagName is undefined');
		return document.createElement(this.tagName) as Component;
	}

	private $$bindings?: Bindings;
	private $$prebind?: Observable<unknown>[];
	protected jsxAttributes!: AttributeType<this>;

	readonly render?: (node: HTMLElement) => void = this.render;
	readonly attributes$ = new Subject<unknown>();

	Shadow = (p: { children: Children }) => {
		renderChildren(this, p.children, getShadow(this));
		this.jsxAttributes;
		return this as Component;
	};

	Slot = (p: { selector: string; name?: string; className?: string }) => {
		const el = document.createElement('slot');
		const name = (el.name = p.name || p.selector);
		const selector = p.selector;
		if (p.className) el.className = p.className;
		this.bind(
			observeChildren(this).tap(() => {
				for (const node of this.children)
					if (node.matches(selector)) node.slot = name;
			})
		);

		return el;
	};

	bind(obs: Observable<unknown>) {
		const render = this.render;
		if (render) {
			const bindings = this.$$prebind || (this.$$prebind = []);
			bindings.push(obs);
		} else {
			if (!this.$$bindings) this.$$bindings = new Bindings();
			this.$$bindings.bind(obs);
		}
	}

	protected connectedCallback() {
		const render = this.render;
		if (render) {
			(this.render as undefined) = undefined;
			render(this);
			if (this.$$prebind) this.$$prebind.forEach(b => this.bind(b));
		}
		if (this.$$bindings) this.$$bindings.connect();
	}

	protected disconnectedCallback() {
		if (this.$$bindings) this.$$bindings.disconnect();
	}

	protected attributeChangedCallback(
		name: keyof this,
		oldValue: string | null,
		value: string | null
	) {
		if (oldValue !== value) {
			const thisValue: boolean | string = this[name] as unknown as
				| boolean
				| string;
			const isBoolean = thisValue === false || thisValue === true;
			if (value === '') {
				this[name] = (isBoolean
					? true
					: '') as unknown as this[keyof this];
			} else
				this[name] = (value === null
					? isBoolean
						? false
						: undefined
					: value) as unknown as this[keyof this];
		}
	}
}

export function pushRender<T extends Component>(
	proto: T,
	renderFn: RenderFunction<T>
) {
	const oldRender = proto.render;
	(proto.render as (node: T) => void) = function (el: T) {
		if (oldRender) oldRender(el);
		renderFn(el);
	};
}

export function appendShadow<T extends Component>(
	host: T,
	child: Node | Observable<unknown>
) {
	if (child instanceof Node) {
		const shadow = getShadow(host);
		shadow.appendChild(child);
	} else host.bind(child);
}

export function augment<T extends Component>(
	constructor: typeof Component,
	decorators: Augmentation<T>[]
) {
	pushRender<T>(constructor.prototype as T, node => {
		for (const d of decorators) {
			const result = d(node);
			if (result && result !== node) appendShadow(node, result);
		}
	});
}

export function registerComponent(tagName: string, ctor: ComponentConstructor) {
	ctor.tagName = tagName;
	registeredComponents[tagName] = ctor as typeof Component;
	customElements.define(tagName, ctor as unknown as CustomElementConstructor);
}

export function Augment(): (ctor: ComponentConstructor) => void;
export function Augment<T extends Component>(
	...augs: [string | Augmentation<T> | void, ...Augmentation<T>[]]
): (ctor: ComponentConstructor) => void;
export function Augment<T extends Component>(
	...augs: [string | Augmentation<T> | void, ...Augmentation<T>[]]
) {
	return (ctor: ComponentConstructor) => {
		let newAugs: Augmentation<T>[], tagName: string;

		if (augs && typeof augs[0] === 'string') {
			tagName = augs[0];
			newAugs = augs.slice(1) as unknown as Augmentation<T>[];
		} else {
			newAugs = augs as unknown as Augmentation<T>[];
			tagName = ctor.tagName;
		}

		if (tagName) registerComponent(tagName, ctor);
		augment(ctor as typeof Component, newAugs);
	};
}

export function connect<T extends Component>(bindFn: (node: T) => void) {
	return (host: T) => host.bind(observable(() => bindFn(host)));
}

export function onUpdate<T extends Component>(host: T) {
	return concat(
		of(host),
		host.attributes$.map(() => host)
	);
}

/**
 * Fires when connected and on attribute change
 */
export function update<T extends Component>(fn: (node: T) => void) {
	return (host: T) => host.bind(onUpdate(host).tap(fn));
}

export function attributeChanged<
	T extends Component,
	K extends ComponentAttributeName<T>
>(element: T, attribute: K) {
	return (element.attributes$ as Subject<AttributeEvent<T>>).pipe(
		filter(ev => ev.attribute === attribute),
		map(ev => ev.value)
	) as Observable<T[K]>;
}

export function get<T extends Component, K extends ComponentAttributeName<T>>(
	element: T,
	attribute: K
): Observable<T[K]> {
	return merge(
		attributeChanged(element, attribute),
		defer(() => of(element[attribute]))
	);
}

interface AttributeOptions<T extends Component> {
	persist?: boolean;
	persistOperator?: Operator<AttributeEvent<T>, AttributeEvent<T>>;
	observe?: boolean;
	/// Render function to be called on component initialization
	render?: RenderFunction<T>;
	/// Parse attribute string
	parse?(val: unknown): unknown;
}

function getObservedAttributes(target: typeof Component) {
	let result = target.observedAttributes;

	if (result && !target.hasOwnProperty('observedAttributes'))
		result = target.observedAttributes.slice(0);

	return (target.observedAttributes = result || []);
}

const attributeOperator = tap<AttributeEvent<Component>>(
	({ value, target, attribute }) => {
		setAttribute(target, attribute, value);
	}
);

export function Attribute(options?: AttributeOptions<Component>) {
	/*eslint @typescript-eslint/no-explicit-any:off */
	return <T extends Component>(
		target: T,
		attribute: ComponentAttributeName<T>,
		descriptor?: PropertyDescriptor
	): any => {
		const ctor = target.constructor as typeof Component;
		const prop = ('$$' + String(attribute)) as keyof T;

		if (options?.observe !== false)
			getObservedAttributes(ctor).push(attribute as string);

		if (descriptor) Object.defineProperty(target, prop, descriptor);

		if (options?.persist || options?.persistOperator)
			pushRender(target, (node: T) => {
				return node.bind(
					concat(
						defer(() =>
							of({
								attribute,
								target: node,
								value: node[attribute],
							})
						),
						(node.attributes$ as Subject<AttributeEvent<T>>).pipe(
							filter(ev => ev.attribute === attribute)
						)
					).pipe(
						(options.persistOperator ||
							(attributeOperator as unknown)) as Operator<
							AttributeEvent<T>
						>
					)
				);
			});

		if (options?.render) pushRender(target, options.render);

		return {
			enumerable: true,
			configurable: false,
			get(this: T) {
				return this[prop];
			},
			set(this: T, value: T[ComponentAttributeName<T>]) {
				if (this[prop] !== value) {
					const newValue = options?.parse
						? (options.parse(value) as T[keyof T])
						: value;
					this[prop] = newValue;
					// Can be undefined if setting prototype value
					this.attributes$?.next({
						target: this,
						attribute,
						value: newValue,
					});
				} else if (descriptor) this[prop] = value;
			},
		};
	};
}

export function StyleAttribute() {
	return Attribute({
		persist: true,
		observe: true,
	});
}

export function EventAttribute() {
	return <T extends Component>(
		target: T,
		attribute: keyof T,
		descriptor?: PropertyDescriptor
	): any =>
		Attribute({
			render(el) {
				el.addEventListener((attribute as string).slice(2), ev => {
					if (ev.target === el)
						(
							(el as T)[attribute] as unknown as (
								a: Event
							) => void
						)?.call(el, ev);
				});
			},
			parse(val: string) {
				return val ? new Function('event', val) : undefined;
			},
		})(target, attribute, descriptor);
}

export function Property() {
	return Attribute({
		persist: false,
		observe: false,
	});
}

export function getRegisteredComponents() {
	return { ...registeredComponents };
}

@Augment('cxl-span')
export class Span extends Component {}

export function Slot() {
	return document.createElement('slot');
}
