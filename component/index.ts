///<amd-module name="@cxl/component"/>
import { AttributeType, Children, renderChildren } from '@cxl/tsx';
import { getShadow, onChildrenMutation, animationFrame } from '@cxl/dom';
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
) => Node | Observable<any> | void;

export interface AttributeEvent<T, K extends keyof T = keyof T> {
	target: T;
	attribute: K;
	value: T[K];
}

const registeredComponents: Record<string, typeof Component> = {};
const subscriber = {
	error(e: any) {
		throw e;
	},
};

export class Bindings {
	private subscriptions?: Subscription[];
	bindings?: Observable<any>[];

	bind(binding: Observable<any>) {
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
	static create() {
		if (!this.tagName) throw new Error('tagName is undefined');
		return document.createElement(this.tagName);
	}

	private $$bindings?: Bindings;
	private $$prebind?: Observable<any>[];
	private render?: (node: any) => void;
	protected jsxAttributes!: AttributeType<this>;
	protected attributes$ = new Subject<AttributeEvent<any, any>>();

	Shadow = (p: { children: Children }) => {
		renderChildren(this, p.children, getShadow(this));
		return this as Component;
	};

	Slot = (p: { selector: string; name?: string }) => {
		const el = document.createElement('slot');
		const name = (el.name = p.name || p.selector);
		const selector = p.selector;
		this.bind(
			merge(
				animationFrame.first().tap(() => {
					for (const node of this.children)
						if (node.matches(selector)) node.slot = selector;
				}),
				onChildrenMutation(this).tap(ev => {
					const node = ev.value;
					if (
						ev.type === 'added' &&
						node instanceof HTMLElement &&
						node.matches(selector)
					)
						node.slot = name;
				})
			)
		);

		return el;
	};

	bind(obs: Observable<any>) {
		const render = this.render as any;
		if (render) {
			const bindings = this.$$prebind || (this.$$prebind = []);
			bindings.push(obs);
		} else {
			if (!this.$$bindings) this.$$bindings = new Bindings();
			this.$$bindings.bind(obs);
		}
	}

	protected connectedCallback() {
		const render = this.render as any;
		if (render) {
			this.render = undefined;
			render(this);
			if (this.$$prebind)
				this.$$prebind.forEach((b: Observable<any>) => this.bind(b));
		}
		if (this.$$bindings) this.$$bindings.connect();
	}

	protected disconnectedCallback() {
		if (this.$$bindings) this.$$bindings.disconnect();
	}

	protected attributeChangedCallback(
		name: keyof this,
		oldValue: any,
		value: any
	) {
		if (oldValue !== value) {
			if (value === '') {
				const thisValue: any = this[name];
				(this as any)[name] =
					thisValue === false || thisValue === true ? true : '';
			} else this[name] = value === null ? false : value;
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

export function appendShadow<T extends Component>(
	host: T,
	child: Node | Observable<any>
) {
	if (child instanceof Node) {
		const shadow = getShadow(host);
		shadow.appendChild(child);
	} else host.bind(child);
}

export function augment<T extends Component>(
	constructor: new () => T,
	decorators: Augmentation<T>[]
) {
	pushRender<T>(constructor.prototype, node => {
		for (const d of decorators) {
			const result = d(node);
			if (result && result !== node) appendShadow(node, result);
		}
	});
}

export function registerComponent(tagName: string, ctor: any) {
	ctor.tagName = tagName;
	registeredComponents[tagName] = ctor;
	customElements.define(tagName, ctor);
}

export function Augment<T extends Component>(): (ctor: any) => void;
export function Augment<T extends Component>(
	...augs: [string | Augmentation<T>, ...Augmentation<T>[]]
): (ctor: any) => void;
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

export function connect<T extends Component>(bindFn: (node: T) => void) {
	return (host: T) => host.bind(observable(() => bindFn(host)));
}

function attributes$(host: Component): Observable<AttributeEvent<any, any>> {
	return (host as any).attributes$;
}

export function onUpdate<T extends Component>(host: T) {
	return concat(
		of(host),
		attributes$(host).map(() => host)
	);
}

/**
 * Fires when connected and on attribute change
 */
export function update<T extends Component>(fn: (node: T) => void) {
	return (host: T) => host.bind(onUpdate(host).tap(fn));
}

export function attributeChanged<T extends Component, K extends keyof T>(
	element: T,
	attribute: K
): Observable<T[K]> {
	return attributes$(element).pipe(
		filter(ev => ev.attribute === attribute),
		map(ev => ev.value)
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
	/// Render function to be called on component initialization
	render: RenderFunction<any>;
}

function getObservedAttributes(target: typeof Component) {
	let result = target.observedAttributes;

	if (result && !target.hasOwnProperty('observedAttributes'))
		result = target.observedAttributes.slice(0);

	return (target.observedAttributes = result || []);
}

const attributeOperator = tap<AttributeEvent<any, any>>(
	({ value, target, attribute }) => {
		if (value === false || value === undefined || value === 0) {
			if (target.hasAttribute(attribute))
				target.removeAttribute(attribute);
		} else if (value === true) target.setAttribute(attribute, '');
		else target.setAttribute(attribute, value);
	}
);

export function Attribute(options?: Partial<AttributeOptions>): any {
	return (
		target: any,
		attribute: string,
		descriptor?: PropertyDescriptor
	) => {
		const ctor = target.constructor as typeof Component;
		const prop = '$$' + attribute;

		getObservedAttributes(ctor).push(attribute);

		if (descriptor) Object.defineProperty(target, prop, descriptor);

		if (options?.persist || options?.persistOperator)
			pushRender(target, (node: Component) => {
				return node.bind(
					concat(
						defer(() =>
							of<AttributeEvent<any, any>>({
								attribute,
								target: node,
								value: (node as any)[attribute],
							})
						),
						attributes$(node).pipe(
							filter(ev => ev.attribute === attribute)
						)
					).pipe(options.persistOperator || attributeOperator)
				);
			});

		if (options?.render) pushRender(target, options.render);

		return {
			enumerable: true,
			get(this: any) {
				return this[prop];
			},
			set(this: any, value: any) {
				if (this[prop] !== value) {
					this[prop] = value;
					// Can be undefined if setting prototype value
					this.attributes$?.next({
						target: this,
						attribute,
						value,
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

export function getRegisteredComponents() {
	return { ...registeredComponents };
}

@Augment('cxl-span')
export class Span extends Component {}

export function Slot() {
	return document.createElement('slot');
}
