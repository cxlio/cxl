import type { AttributeType } from '../tsx/index.js';
import { getShadow } from '../dom/index.js';
import {
	Observable,
	Operator,
	Subject,
	Subscription,
	concat,
	defer,
	filter,
	from,
	isInterop,
	map,
	of,
	tap,
} from '../rx/index.js';

type RenderFunction<T> = (node: T) => void;
type Augmentation<T extends Component> = (host: T) => Node | void;

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
	private bindings?: Observable<any>[];

	bind(binding: Observable<any>) {
		if (this.subscriptions)
			throw new Error('Cannot bind connected component.');
		if (!this.bindings) this.bindings = [];
		this.bindings.push(binding);
	}

	connect() {
		if (!this.subscriptions && this.bindings)
			this.subscriptions = this.bindings.map(b =>
				b.subscribe(subscriber)
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
	private render?: (node: any) => void;

	// EventMap
	eventMap?: any;
	jsxAttributes?: AttributeType<this>;
	attributes$ = new Subject<AttributeEvent<any, any>>();

	bind(obs: Observable<any>) {
		if (!this.$$bindings) this.$$bindings = new Bindings();
		this.$$bindings.bind(obs);
	}

	connectedCallback() {
		if (this.render) {
			this.render(this);
			delete this.render;
		}

		if (this.$$bindings) this.$$bindings.connect();
	}

	disconnectedCallback() {
		if (this.$$bindings) this.$$bindings.disconnect();
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

export function appendShadow(host: Component, child: Node) {
	const shadow = getShadow(host);
	if (child instanceof Node) shadow.appendChild(child);
	if (isInterop(child)) host.bind(from(child));
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
	if (!ctor.tagName) ctor.tagName = tagName;
	registeredComponents[tagName] = ctor;
	try {
		customElements.define(tagName, ctor);
	} catch (e) {
		console.warn(`Component ${tagName} already registered`);
	}
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

export function bind<T extends Component>(
	bindFn: (node: T) => Observable<any>
) {
	return (host: T) => host.bind(bindFn(host));
}

export function connect<T extends Component>(bindFn: (node: T) => void) {
	return (host: T) =>
		host.bind(
			defer(() => {
				bindFn(host);
			})
		);
}

export function onUpdate<T extends Component>(host: T, fn: (node: T) => void) {
	return concat(of(host), host.attributes$).pipe(tap(() => fn(host)));
}

/**
 * Fires when connected and on attribute change
 */
export function update<T extends Component>(fn: (node: T) => void) {
	return (host: T) => host.bind(onUpdate(host, fn));
}

export function attributeChanged<T extends Component, K extends keyof T>(
	element: T,
	attribute: K
): Observable<T[K]> {
	return element.attributes$.pipe(
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

const attributeOperator = tap<AttributeEvent<any, any>>(
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
						node.attributes$.pipe(
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
					this.attributes$.next({
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

export function role(roleName: string) {
	return (host: Component) =>
		host.bind(
			defer(() => {
				const el = host as any;
				!el.hasAttribute('role') && el.setAttribute('role', roleName);
			})
		);
}

export function Slot() {
	return document.createElement('slot');
}
