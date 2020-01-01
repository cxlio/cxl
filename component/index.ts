import { render, View, content, triggerEvent } from '../template';
import { Observable, tap } from '../rx';
import { StoreBase } from '../store';
import { StyleSheet, Styles as CSSStyles, Media, globalStyles } from '../css';
import { ChildrenObserver, setAttribute } from '../dom';

type Binding = Observable<any>;
type BindingFunction<T> = (view: ComponentView<T>) => Binding | Binding[];
type DecorateFunction<T> = (view: ComponentView<T>) => void;
type EventsDefinition = { [ev: string]: Observable<any> };
type EventFunction<T> = (view: ComponentView<T>) => EventsDefinition;
type RenderFunction<T> = (view: ComponentView<T>) => Element;

export interface Controller<T> {
	meta?: ComponentDefinition<T>;
	new (): T;
}

export interface ComponentDefinition<T> {
	name?: string;
	attributes?: string[];
	attributeDefinition?: PropertyDescriptorMap;
	controller: Controller<T>;
	render?: (view: ComponentView<T>) => void;
	methods?: string[];
	events?: string[];
}

interface ComponentMeta {
	name?: string;
}

class ComponentStore<T> extends StoreBase<T> {
	raf?: number;
	digest() {
		if (this.raf) return;

		this.raf = requestAnimationFrame(() => {
			this.subject.next(this.state);
			this.raf = undefined;
		});
	}
}

export class ComponentView<T> extends View {
	hasTemplate = false;
	private _store?: ComponentStore<T>;
	public element: HTMLElement & T;

	get store() {
		return this._store || (this._store = new ComponentStore(this.state));
	}

	get select() {
		return this.store.select.bind(this.store);
	}

	get children() {
		return new ChildrenObserver(this.element);
	}

	$content = (selector: string) => {
		return (el: HTMLSlotElement) =>
			this.children.pipe(content(selector, el));
	};

	set = (key: keyof T) => {
		return tap<T[keyof T]>(val => this.store.set(key, val));
	};

	protected subscriber = {
		next: () => {
			if (this.store) this.store.digest();
		}
	};

	constructor(public state: T, element: HTMLElement) {
		super();
		this.element = element as any;
	}
}

function createView<T>(
	def: ComponentDefinition<T>,
	node: HTMLElement
): ComponentView<T> {
	const state: T = new def.controller(),
		view = ((node as any).cxlView = new ComponentView(state, node));

	if (def.render) def.render(view);

	if (!view.hasTemplate && node.shadowRoot)
		node.shadowRoot.appendChild(document.createElement('slot'));

	return view;
}

class ComponentFactory {
	components = new Map<string | Function, ComponentDefinition<any>>();

	registerCustomElement<T>(name: string, meta: ComponentDefinition<T>) {
		class Constructor extends HTMLElement {
			static observedAttributes = meta.attributes;
			private __cxlView = createView(meta, this);

			connectedCallback() {
				this.__cxlView.connect();
			}

			disconnectedCallback() {
				this.__cxlView.disconnect();
			}

			attributeChangedCallback(
				name: keyof T,
				_oldValue: any,
				newValue: any
			) {
				this.__cxlView.store.set(
					name,
					newValue === '' ? true : newValue
				);
			}
		}
		const attributeDefinition = meta.attributeDefinition;

		if (attributeDefinition)
			Object.defineProperties(Constructor.prototype, attributeDefinition);

		customElements.define(name, Constructor);
	}

	registerComponent<T>(meta: ComponentDefinition<T>) {
		if (meta.name) {
			this.components.set(meta.name, meta);
			this.registerCustomElement(meta.name, meta);
		}
		this.components.set(meta.controller, meta);
		meta.controller.meta = meta;
	}
}

const factory = new ComponentFactory();

export function getRegisteredComponents() {
	return new Map(factory.components);
}

function getComponentDefinition<T>(
	constructor: new () => T
): ComponentDefinition<T> {
	const controller: Controller<T> = constructor as any;
	let result: ComponentDefinition<T>;

	if (controller.meta) {
		if (!controller.hasOwnProperty('meta')) {
			const Meta = function Meta() {
				/* noop */
			};
			Meta.prototype = controller.meta;
			result = new (Meta as any)();
			result.constructor = Meta;
			result.controller = controller;
		} else return controller.meta;
	} else result = { controller };

	return (controller.meta = result);
}

export function createComponent<T>(
	nameOrClass: string | Controller<T>,
	element?: HTMLElement
) {
	const def =
		typeof nameOrClass === 'string'
			? factory.components.get(nameOrClass)
			: nameOrClass.meta;

	if (!def) throw new Error('Invalid component');

	element = element || document.createElement(def.name || 'div');
	const view = createView(def, element);

	return new Observable<Element>(subs => {
		view.connect();
		subs.next(view.element);
		return () => view.disconnect();
	});
}

export function Component(meta?: string | ComponentMeta) {
	const name = meta && (typeof meta === 'string' ? meta : meta.name);

	return function<T>(constructor: new () => T) {
		const def = getComponentDefinition(constructor);
		def.name = name;
		factory.registerComponent(def);
	};
}

function pushRender<T>(meta: ComponentDefinition<T>, fn: DecorateFunction<T>) {
	const oldRender = meta.render;
	meta.render = view => {
		fn(view);
		if (oldRender) oldRender(view);
	};
}

export function decorateComponent<T>(fn: DecorateFunction<T>) {
	return (constructor: new () => T) => {
		const meta = getComponentDefinition<T>(constructor);
		pushRender(meta, fn);
	};
}

export function Attribute<T extends {}>() {
	return (proto: T, name: string) => {
		const meta = getComponentDefinition<T>(
			proto.constructor as new () => T
		);
		const attrs = meta.hasOwnProperty('attributes')
			? meta.attributes
			: (meta.attributes = meta.attributes
					? meta.attributes.slice(0)
					: []);
		const attrDef = meta.hasOwnProperty('attributeDefinition')
			? meta.attributeDefinition
			: (meta.attributeDefinition = meta.attributeDefinition
					? { ...meta.attributeDefinition }
					: {});

		if (attrDef)
			attrDef[name] = {
				get() {
					return (this as any).cxlView.state[name];
				},
				set(value) {
					(this as any).cxlView.store.set(name, value);
					return value;
				}
			};

		attrs?.push(name);
		pushRender(meta, view =>
			view.addBinding(
				view.store
					.select(name as any)
					.pipe(tap(value => setAttribute(view.element, name, value)))
			)
		);
	};
}

export function Method() {
	// TODO
}

export function Events<T>(eventFunction: EventFunction<T>) {
	return decorateComponent((view: ComponentView<T>) => {
		const events = eventFunction(view),
			el = view.element;
		for (const ev in events) {
			view.addBinding(events[ev].pipe(triggerEvent(el, ev)));
		}
	});
}

export function Bind<T>(bindFn: BindingFunction<T>) {
	return decorateComponent((view: ComponentView<T>) =>
		view.addBinding(bindFn(view))
	);
}

function getShadow(el: Element) {
	return (
		el.shadowRoot ||
		el.attachShadow({
			mode: 'open'
		})
	);
}

export function Template<T = any>(renderFn: RenderFunction<T>) {
	return decorateComponent((view: ComponentView<T>) => {
		view.hasTemplate = true;
		view.addBinding(
			render(renderFn.bind(null, view)).pipe(
				tap(el => getShadow(view.element).appendChild(el))
			)
		);
	});
}

export function Styles(stylesOrMedia: CSSStyles | Media, opStyles?: CSSStyles) {
	let media: any;
	let styles: any = stylesOrMedia;

	if (typeof stylesOrMedia === 'string' && opStyles) {
		media = stylesOrMedia;
		styles = opStyles;
	}

	return decorateComponent(({ element }) => {
		const shadow = getShadow(element);
		if (!(element as any).cxlCssHasGlobal) {
			globalStyles.cloneTo(shadow);
			(element as any).cxlCssHasGlobal = true;
		}

		const stylesheet = new StyleSheet({
			tagName: element.tagName,
			media,
			styles
		});

		stylesheet.cloneTo(shadow);
	});
}
