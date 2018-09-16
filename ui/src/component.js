(cxl => {

const
	COMPONENTS = {}
;

class AttributeMonitor extends cxl.Directive {

	$digest(state)
	{
		const newVal = state[this.parameter];

		if (newVal !== this.value)
		{
			// TODO Optimize
			if (newVal===true || newVal===false)
				cxl.dom.setAttribute(this.element, this.parameter, newVal);

			if (this.element.$$attributeObserver)
				this.element.$$attributeObserver.trigger(this.parameter);
		}

		return newVal;
	}

	connect()
	{
		this.digest = this.$digest;
		this.connect = null;
	}

}


class ComponentFactory
{
	$attributes(node, attributes)
	{
		attributes.forEach(function(a) {

			const monitor = new AttributeMonitor(node, a, node.$view);

			if (node.hasAttribute(a))
				monitor.value = node.$view.state[a] = node.getAttribute(a) || true;

			node.$view.bindings.push(monitor);
		});
	}

	$bindings(component, value)
	{
		cxl.compiler.parseBinding(component, value, component.$view);
	}

	$attachShadow(node)
	{
		return node.attachShadow({ mode: 'open' });
	}

	$renderTemplate(node, template)
	{
		const parent = this.$attachShadow(node), nodes=template.compile(node.$view);
		parent.appendChild(nodes);
	}

	$initializeTemplate(node, meta)
	{
		if (!meta.$template)
		{
			if (meta.templateId)
				meta.$template = cxl.Template.fromId(meta.templateId);
			else if (meta.template)
				meta.$template = new cxl.Template(meta.template);
		}

		if (meta.styles && !meta.$styles)
			meta.$styles = new cxl.css.StyleSheet(meta);
	}

	createComponent(meta, node)
	{
		const view = node.$view = new cxl.View(meta.controller, node);

		if (meta.attributes)
			this.$attributes(node, meta.attributes);

		if (meta.initialize)
			meta.initialize.call(node, view.state);

		this.$initializeTemplate(node, meta);

		if (meta.bindings)
			this.$bindings(node, meta.bindings);

		if (meta.$template)
			this.$renderTemplate(node, meta.$template);

		cxl.renderer.commitDigest(node.$view);

		return node;
	}
}

const factory = new ComponentFactory();

factory.components = COMPONENTS;

class ComponentDefinition
{
	$attributes(prototype, value)
	{
		value.forEach(function(a) {
			Object.defineProperty(prototype, a, {
				enumerable: true,
				name: a,
				get() { return this.$view.state[a]; },
				set(newVal) { this.$view.set(a, newVal); return newVal; }
			});
		});
	}

	$methods(prototype, value)
	{
		value.forEach(function(m) {
			prototype[m] = function() {
				const result = this.$view.state[m].apply(this.$view.state, arguments);
				this.$view.digest();
				return result;
			};
		});
	}

	$registerElement(name, Constructor)
	{
		window.customElements.define(name, Constructor);
	}

	constructor(meta, controller)
	{
		if (controller)
			meta.controller = typeof(controller)==='function' ?
				controller : this.normalizeController(controller);

		if (meta.extend)
			meta = this.extendComponent(meta, meta.extend);

		this.name = meta.name;
		this.meta = meta;
		this.Component = this.componentConstructor(meta);

		COMPONENTS[this.name] = this;
		this.$registerElement(this.name, this.Component);
	}

	extendComponent(def, parent)
	{
		var extend = COMPONENTS[parent].meta;

		if (def.events && extend.events)
			def.events = extend.events.concat(def.events);

		def = Object.assign({}, extend, def);

		if (def.controller && extend.controller)
			def.controller.prototype = Object.assign({}, extend.controller.prototype, def.controller.prototype);

		if (def.bindings && def.bindings !== extend.bindings)
			def.bindings += ' ' + extend.bindings;

		return def;
	}

	componentConstructor(meta)
	{
		class Component extends cxl.HTMLElement {

			static get observedAttributes() { return meta.attributes; }

			constructor()
			{
				super();
				factory.createComponent(meta, this);
			}

			attributeChangedCallback(name, oldVal, newVal)
			{
				this.$view.setAttribute(name, newVal);
			}

			connectedCallback()
			{
				this.$view.connect();
			}

			disconnectedCallback()
			{
				this.$view.disconnect();
			}
		}

		if (meta.attributes)
			this.$attributes(Component.prototype, meta.attributes);

		if (meta.methods)
			this.$methods(Component.prototype, meta.methods);

		return Component;
	}

	normalizeController(controller)
	{
		var State = controller.hasOwnProperty('constructor') ?
			controller.constructor : function Controller() { };

		State.prototype = controller;

		return State;
	}

}

Object.assign(cxl, {
	ComponentDefinition: ComponentDefinition,
	ComponentFactory: ComponentFactory,
	componentFactory: factory,

	component(meta, controller)
	{
		var def = new ComponentDefinition(meta, controller);
		return def.Constructor;
	}
});

})(this.cxl);