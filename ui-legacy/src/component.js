(cxl => {
	'use strict';

	const COMPONENTS = {};

	/**
	 * Persist attributes from state.
	 */
	class AttributeMonitor extends cxl.Directive {
		digest(state) {
			const el = this.element,
				attr = this.parameter,
				newVal = state[attr];
			if (newVal !== this.value) {
				// Automatically reflect the attribute if it is a boolean
				if (newVal === true) el.setAttribute(attr, '');
				else if (newVal === false) el.removeAttribute(attr);

				if (el.$$attributeObserver)
					el.$$attributeObserver.trigger(attr);
			}

			return newVal;
		}
	}

	class ResourceManager {
		push(resource) {
			if (!this.$resources) this.$resources = [];

			this.$resources.push(resource);
		}

		destroy() {
			if (this.$resources)
				this.$resources.forEach(b => (b.destroy || b.unsubscribe)());
		}
	}

	function onMutation(events) {
		for (const mutation of events) {
			const node = mutation.target,
				newVal = node.getAttribute(mutation.attributeName);
			node.$view.setAttribute(mutation.attributeName, newVal);
		}
	}

	class ComponentFactory {
		$attributes(node, attributes) {
			const view = node.$view;

			attributes.forEach(a => {
				view.bindings.push(new AttributeMonitor(node, a, view));
			});

			const observer = (view.attributeObserver = new MutationObserver(
				onMutation
			));
			observer.observe(node, {
				attributes: true,
				attributeFilter: attributes
			});
		}

		$bindings(component, value) {
			cxl.compiler.parseBinding(component, value, component.$view);
		}

		$attachShadow(node) {
			return node.attachShadow({ mode: 'open' });
		}

		$renderTemplate(node, template) {
			const parent = this.$attachShadow(node),
				nodes = template.compile(node.$view);
			parent.appendChild(nodes);
		}

		$initializeTemplate(node, meta) {
			if (!meta.$template) {
				if (meta.templateId)
					meta.$template = cxl.Template.fromId(meta.templateId);
				else if (meta.template)
					meta.$template = new cxl.Template(meta.template);
			}

			if (meta.styles && !meta.$styles)
				meta.$styles = new cxl.css.StyleSheet(meta);
		}

		createComponent(meta, node) {
			const view = (node.$view = new cxl.View(meta.controller, node)),
				state = view.state;

			if (meta.attributes) {
				meta.attributes.forEach(function(a) {
					if (node.hasAttribute(a))
						state[a] = node.getAttribute(a) || true;
					// TODO verify
					else if (state[a] === undefined) state[a] = null;
				});
			}

			if (meta.initialize) meta.initialize.call(node, view.state);

			this.$initializeTemplate(node, meta);

			if (meta.$template) {
				this.$renderTemplate(node, meta.$template);
				// Commit all the template bindings.
				if (view.bindings.length) cxl.renderer.commitDigest(view);
			}

			// Initialize Attributes and bindings after the first commit
			if (meta.attributes) this.$attributes(node, meta.attributes);

			if (meta.bindings) this.$bindings(node, meta.bindings);

			return node;
		}
	}

	const factory = new ComponentFactory();

	factory.components = COMPONENTS;

	class ComponentDefinition {
		$attributes(prototype, value) {
			value.forEach(function(a) {
				Object.defineProperty(prototype, a, {
					enumerable: true,
					name: a,
					get() {
						return this.$view.state[a];
					},
					set(newVal) {
						this.$view.set(a, newVal);
						return newVal;
					}
				});
			});
		}

		$methods(prototype, value) {
			value.forEach(function(m) {
				prototype[m] = function() {
					const result = this.$view.state[m].apply(
						this.$view.state,
						arguments
					);
					this.$view.digest();
					return result;
				};
			});
		}

		$registerElement(name, Constructor) {
			window.customElements.define(name, Constructor);
		}

		constructor(meta, controller) {
			if (controller)
				meta.controller =
					typeof controller === 'function'
						? controller
						: this.normalizeController(controller);

			if (meta.extend) meta = this.extendComponent(meta, meta.extend);

			this.name = meta.name;
			this.meta = meta;
			this.Component = this.componentConstructor();

			if (this.name) {
				COMPONENTS[this.name] = this;
				this.$registerElement(this.name, this.Component);
			}
		}

		extend(def) {
			const parentDef = this.meta,
				result = Object.assign({}, parentDef, def);
			if (def.events && parentDef.events)
				result.events = parentDef.events.concat(def.events);
			if (def.methods && parentDef.methods)
				result.methods = parentDef.methods.concat(def.methods);
			if (def.attributes && parentDef.attributes)
				result.attributes = parentDef.attributes.concat(def.attributes);

			if (def.styles && parentDef.styles) {
				let css = (result.styles = Array.isArray(parentDef.styles)
					? [].concat(parentDef.styles)
					: [parentDef.styles]);

				if (Array.isArray(def.styles))
					result.styles = css.concat(def.styles);
				else css.push(def.styles);
			}

			if (def.controller && parentDef.controller)
				result.controller.prototype = Object.assign(
					{},
					parentDef.controller.prototype,
					def.controller.prototype
				);

			if (def.bindings && parentDef.bindings)
				result.bindings = parentDef.bindings + ' ' + def.bindings;

			return result;
		}

		extendComponent(def, parent) {
			return (parent instanceof ComponentDefinition
				? parent
				: COMPONENTS[parent]
			).extend(def);
		}

		componentConstructor() {
			const def = this,
				meta = def.meta;

			class Component extends cxl.HTMLElement {
				constructor() {
					super();
					factory.createComponent(def.meta, this);
				}

				connectedCallback() {
					// FIX for safari, component not always have attributes initialized
					/*if (meta.attributes) {
						meta.attributes.forEach(a => {
							if (this.hasAttribute(a))
								this.$view.state[a] =
									this.getAttribute(a) || true;
						});
					}*/

					this.$view.connect();
				}

				disconnectedCallback() {
					this.$view.disconnect();
				}
			}

			if (meta.attributes)
				this.$attributes(Component.prototype, meta.attributes);

			if (meta.methods) this.$methods(Component.prototype, meta.methods);

			return Component;
		}

		normalizeController(controller) {
			var State = controller.hasOwnProperty('constructor')
				? controller.constructor
				: function Controller() {};

			State.prototype = controller;

			return State;
		}
	}

	Object.assign(cxl, {
		ResourceManager: ResourceManager,
		ComponentDefinition: ComponentDefinition,
		ComponentFactory: ComponentFactory,
		componentFactory: factory,

		component(meta, controller) {
			var def = new ComponentDefinition(meta, controller);
			return cxl.dom.bind(cxl, def.name);
		},

		extendComponent(name, meta) {
			const parentDef = COMPONENTS[name];
			parentDef.meta = parentDef.extend(meta);
		},

		extendStyles(name, styles) {
			return cxl.extendComponent(name, { styles: styles });
		}
	});
})(this.cxl);