import { Binding, render, View } from '../template';
import { Observable, tap } from '../rx';
import { StoreBase } from '../store';
import { StyleSheet, Styles } from '../css';

export type Slot = any;

type BindingFunction<T> = (view: ComponentView<T>) => Binding | Binding[];
type RenderFunction<T> = (view: ComponentView<T>) => Element;

export interface Controller<T> {
	meta?: ComponentDefinition<T>;
	render?: (view: ComponentView<T>) => void;
	attributes?: string[];
	new (): T;
}

interface ComponentDefinition<T> {
	name?: string;
	controller: Controller<T>;
	render?: RenderFunction<T>;
	methods?: string[];
	events?: string[];
}

interface ComponentMeta {
	name?: string;
}

/*class SlotManager {
	private slots?: Slot[];
	defaultSlot?: Slot;

	register(slot: Slot) {
		if (!slot.parameter) this.defaultSlot = slot;

		if (!this.slots) this.slots = [];

		this.slots.push(slot);
	}
}*/

/*
export class ComponentConstructor<T> {
	constructor(private view: View<T>) {}

	connectedCallback() {
		this.view.connected.next(true);
	}

	disconnectedCallback() {
		this.view.connected.next(false);
	}
}
*/

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

class ComponentView<T> extends View {
	private _store?: ComponentStore<T>;

	get store() {
		return this._store || (this._store = new ComponentStore(this.state));
	}

	get select() {
		return this.store.select.bind(this.store);
	}

	get bind() {
		return this.addBinding.bind(this);
	}

	set = (key: keyof T) => {
		return tap<T[keyof T]>(val => this.store.set(key, val));
	};

	protected subscriber = {
		next: () => {
			if (this.store) this.store.digest();
		}
	};

	constructor(public state: T, public element: Element) {
		super();
	}
}

class ComponentFactory {
	components = new Map<string | Function, ComponentDefinition<any>>();

	registerCustomElement<T>(
		name: string,
		{ controller }: ComponentDefinition<T>
	) {
		const attributes = controller.attributes;

		class Constructor extends HTMLElement {
			static observedAttributes = attributes;
			private component = createComponent(controller, this);
			private subscription?: any;

			connectedCallback() {
				this.subscription = this.component.subscribe();
			}

			disconnectedCallback() {
				this.subscription.unsubscribe();
			}

			attributeChangedCallback(name: string) {
				console.log(name);
			}
		}

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

	create<T>(def: ComponentDefinition<T>, node: Element): ComponentView<T> {
		const state: T = new def.controller(),
			view = new ComponentView(state, node);

		if (def.controller.render) def.controller.render(view);

		return view;
	}
}

const factory = new ComponentFactory();

export function createComponent<T>(
	nameOrClass: string | Controller<T>,
	element?: Element
) {
	const def =
		typeof nameOrClass === 'string'
			? factory.components.get(nameOrClass)
			: nameOrClass.meta;

	if (!def) throw new Error('Invalid component');

	element = element || document.createElement(def.name || 'div');
	const view = factory.create(def, element);

	return new Observable<Element>(subs => {
		view.connect();
		subs.next(view.element);
		return () => view.disconnect();
	});
}

export function Component(meta?: string | ComponentMeta) {
	const name = meta && (typeof meta === 'string' ? meta : meta.name);

	return function<T>(constructor: Controller<T>) {
		factory.registerComponent({
			name: name,
			controller: constructor
		});
	};
}

export function decorateComponent<T>(fn: (view: ComponentView<T>) => void) {
	return function(constructor: Controller<T>) {
		const oldRender = constructor.render;
		constructor.render = view => {
			if (oldRender) oldRender(view);
			fn(view);
		};
	};
}

export function Attribute() {
	return (proto: any, name: string) => {
		const constructor = proto.constructor;
		const attrs = constructor.attributes || (constructor.attributes = []);
		attrs.push(name);
	};
}

export function Method() {}

export function Event() {}

export function Bind<T = any>(bindFn: BindingFunction<T>) {
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
		view.addBinding(
			render(renderFn.bind(null, view)).pipe(
				tap(el => getShadow(view.element).appendChild(el))
			)
		);
	});
}

// export function Styles(stylesOrSelector: Styles | string | string[], styles?: Styles) {
export function Styles(styles: Styles) {
	return decorateComponent(({ element }) => {
		const stylesheet = new StyleSheet({
			tagName: element.tagName,
			styles
		});

		if (!element.shadowRoot)
			getShadow(element).appendChild(document.createElement('slot'));

		stylesheet.cloneTo(getShadow(element));
	});
}
