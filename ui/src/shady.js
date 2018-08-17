
(cxl => {
"use strict";

if (window.customElements && !window.$$cxlShady)
	return;

function upgrade(Component, node)
{
	if (!node.$$upgraded)
	{
		node.$$upgraded = true;
		new Component(node);
	}
}

function doWalk(node, connect)
{
	node = node || document.body;

	var Component = node.tagName && registry[node.tagName];

	if (Component && !node.$$upgraded)
		upgrade(Component, node);

	if (connect && node.$$cxlConnected===false)
	{
		Component.connect(node);

		if (node.shadowRoot && node.shadowRoot.firstChild)
			doWalk(node.shadowRoot.firstChild, true);
	}

	if (node.firstChild)
		doWalk(node.firstChild, connect);

	if (node.nextSibling)
		doWalk(node.nextSibling, connect);

	return node;
}

function override(obj, fn)
{
	const original = obj[fn];
	obj[fn] = function() {
		var node = original.apply(this, arguments);
		doWalk(node);
		return node;
	};
}

function disconnectWalk(node)
{
	if (node.$$cxlDisconnect)
		node.$$cxlDisconnect();

	if (node.shadowRoot && node.shadowRoot.firstChild)
		disconnectWalk(node.shadowRoot.firstChild);

	if (node.firstChild)
		disconnectWalk(node.firstChild);

	if (node.nextSibling)
		disconnectWalk(node.nextSibling);
}

function onMutation(event)
{
	event.forEach(function(record) {
		for (var i of record.addedNodes)
			doWalk(i, true);

		for (i of record.removedNodes)
			disconnectWalk(i);
	});
}

function observe()
{
	observer.observe(document.body, { subtree: true, childList: true });
	doWalk(document.body, true);
}

const
	registry = {},
	observer = new MutationObserver(onMutation)
;

cxl.shady = {
	upgrade: doWalk
};

Object.assign(cxl.ComponentDefinition.prototype, {

	$registerElement(name, Constructor) {
		registry[name.toUpperCase()] = Constructor;

		if (document.body)
			doWalk(document.body, true);
	},

	componentConstructor(meta)
	{
		var me = this, observer;

		function onMutation(node, events)
		{
			for (var mutation of events) {
				const newVal = node.getAttribute(mutation.attributeName);
				node.$view.set(mutation.attributeName, newVal==='' ? true : newVal);
			}
		}

		function observeAttributes(node)
		{
			observer = new MutationObserver(onMutation.bind(null, node));
			observer.observe(node, { attributes: true, attributesFilter: meta.attributes });
		}

		class Component {
			constructor(node)
			{
				node.$$cxlConnected = false;

				if (meta.attributes)
				{
					me.$attributes(node, meta.attributes);
					observeAttributes(node);
				}

				if (meta.methods)
					me.$methods(node, meta.methods);

				cxl.componentFactory.createComponent(meta, node);
			}

			static connect(node)
			{
				if (meta.connect)
					meta.connect.call(node, node.$view.state);

				node.$view.connect();

				node.$$cxlConnected = true;
				node.$$cxlDisconnect = function disconnect()
				{
					if (meta.disconnect)
						meta.disconnect.call(this, this.$view.state);

					this.$$cxlDisconnect = this.$$cxlConnected = false;
					this.$view.disconnect();
				};
			}

		}

		if (meta.connect)
			Component.prototype.connectedCallback = meta.connect;

		if (meta.disconnect)
			Component.prototype.disconnectedCallback = meta.disconnect;

		return Component;
	}

});

override(document, 'createElement');
override(Range.prototype, 'createContextualFragment');
override(cxl.Template.prototype, 'clone');

const cloneNode = window.DocumentFragment.prototype.cloneNode;
const importNode = document.importNode.bind(document);

function cloneDeep(node)
{
var
	result = node.tagName==='TEMPLATE' && node.content ? node.cloneNode(true) : node.cloneNode(),
	i = 0,
	l = node.childNodes.length
;
	for (;i<l;i++)
		result.appendChild(cloneDeep(node.childNodes[i]));

	return result;
}

window.DocumentFragment.prototype.cloneNode = function(deep)
{
	return deep ? doWalk(cloneDeep(this)) : cloneNode.call(this);
};

// TODO do this properly
document.importNode = function(node, deep)
{
	return deep ? doWalk(cloneDeep(node)) : importNode.call(this);
};

window.addEventListener('DOMContentLoaded', observe);

if (!window.$$cxlShady && window.Element.prototype.attachShadow)
	return;

Object.assign(cxl.css.StyleSheet.prototype, {

	$attachStyle: function()
	{
		this.$native = document.createElement('STYLE');
		document.head.appendChild(this.$native);
		this.$selector = this.tagName;
		this.$prefix = this.tagName+'--';
	}

});

cxl.directive('style', {

	initialize()
	{
		this.prefix = this.owner.host ? this.owner.host.tagName.toLowerCase() + '--' : '';
	},

	update(val)
	{
		if (this.parameter)
			this.element.classList.toggle(this.prefix + this.parameter, !!val);
		else
			this.element.classList.add(val);
	},

	digest()
	{
		this.update(true);
		this.digest = null;
	}

});

function $indexOf(child)
{
	var parent = child.parentNode;

	if (!parent)
		return null;

	var i = Array.prototype.indexOf.call(parent.childNodes, child);

	if (i===-1)
		throw "Invalid Node";

	return i;
}

function $extendChild(child)
{
	if (child.$cxl)
		return child;

const
	parentNode = Object.getOwnPropertyDescriptor(Node.prototype, 'parentNode')
//	nextSibling = Object.getOwnPropertyDescriptor(Node.prototype, 'nextSibling')
;
	cxl.extend(child, {
		$cxl: true,

		get parentNode()
		{
			const parent = this.$parentNode;

			if (!parent)
				return this.$component || null;

			if (parent.tagName==='SLOT' && parent.$component)
				return parent.$component;

			if (parent.shadowRoot)
				return parent.shadowRoot;

			return parent;
		},

		get nextSibling()
		{
			var i = $indexOf(this);
			return i!==null && this.parentNode.childNodes[i+1];
		}
	});

	Object.defineProperty(child, '$parentNode', parentNode);

	return child;
}

function $extendComponent(component, shadow)
{
	cxl.extend(component, {

		$appendChild: component.appendChild.bind(component),
		$removeChild: component.removeChild.bind(component),

		shadowRoot: shadow,
		childNodes: Array.prototype.slice.call(component.childNodes, 0),

		get firstChild()
		{
			return this.childNodes[0];
		},

		get lastChild()
		{
			return this.childNodes.length ? this.childNodes[this.childNodes.length-1] : null;
		},

		$indexOf(child)
		{
			var i = this.childNodes.indexOf(child);

			if (i===-1)
				throw "Invalid Node";

			return i;
		},

		appendChild(child)
		{
			this.insertBefore(child);
		},

		insertBefore(child, next)
		{
			if (child instanceof DocumentFragment)
			{
				while (child.firstChild)
					this.insertBefore(child.firstChild, next);

				return;
			}

			if (next)
				this.childNodes.splice(this.$indexOf(next), 0, child);
			else
				this.childNodes.push(child);

			$extendChild(child);

			this.shadowRoot.$updateSlots();
		},

		removeChild(child)
		{
			this.childNodes.splice(this.$indexOf(child), 1);

			if (child.$parentNode)
			{
				child.$parentNode.removeChild(child);
				child.$component = null;
			}
		}

	});

	component.childNodes.forEach($extendChild);

	function isParent(child, component)
	{
		do {
			if (child === component)
				return true;
		} while((child=child.parentNode));
	}

	function eventHandlerStop(ev)
	{
		if (ev.$$handled)
			return;

		ev.$$handled = true;

		if (isParent(ev.target, component))
			return;

		ev.stopImmediatePropagation();
		ev.stopPropagation();
	}

	function eventHandler(ev)
	{
		if (ev.$$handled)
			return;

		ev.$$handled = true;

		if (isParent(ev.target))
			return;

		Object.defineProperty(ev, 'target', { value: component });
	}

	const allowCross = [
		'onblur', 'onfocus', 'onfocusin', 'onfocusout', 'onclick', 'ondblclick',
		'onmousedown', 'onmouseenter', 'onmouseleave', 'onmousemove', 'onmouseover', 'onwheel',
		'onmouseout', 'onmouseup', 'ontouchstart', 'ontouchend', 'ontouchmove', 'ontouchcancel',
		'onpointerenter', 'onpointerdown', 'onpointermove', 'onpointerup', 'onpointercancel',
		'onpointerout', 'onpointerleave', 'ongotpointercapture', 'onlostpointercapture',
		'ondragenter', 'ondragleave', 'ondragover', 'onkeypress',
		'onbeforeinput', 'oninput', 'onkeydown', 'onkeyup', 'oncompositionsstart',
		'oncompositionupdate', 'oncompositionend', 'ondragstart', 'ondrag', 'ondragend',
		'ondrop'
	];

	// Catch Events
	for (var prop in component)
		if (prop.indexOf('on')===0)
			component.addEventListener(prop.slice(2),
				allowCross.indexOf(prop)===-1 ? eventHandlerStop : eventHandler, { passive: true });
}

function $extendShadow(host)
{
const
	fragment = {},
 	slots = []
;
	function $findSlot(child)
	{
		const slot = (host.$view.slots && host.$view.slots.find(function(slot) {
			return child.matches && child.matches(slot.parameter);
		})) || host.$view.defaultSlot;

		return slot && slot.slot;
	}

	function $assignSlot(child)
	{
		// Assign Slots
		const slot = $findSlot(child);

		if (slot)
			slot.appendChild(child);
		else
		{
			if (child.$parentNode)
			{
				if (child.$parentNode===host)
					host.$removeChild(child);
				else
					child.$parentNode.removeChild(child);
			}

			child.$component = host;
		}
	}

	cxl.extend(fragment, {
		childNodes: host.childNodes,
		parentNode: null,
		host: host,
		$slots: slots,
		$insertBefore: host.insertBefore.bind(host),
		$removeChild: host.removeChild.bind(host),

		get firstChild()
		{
			return this.childNodes[0];
		},

		appendChild: function(child)
		{
			return this.insertBefore(child);
		},

		insertBefore: function(child, next)
		{
			if (child instanceof DocumentFragment)
			{
				while (child.firstChild)
					this.insertBefore(child.firstChild, next);

				return;
			}

			this.$insertBefore($extendChild(child), next);
		},

		removeChild: function(el)
		{
			return this.$removeChild(el);
		},

		$updateSlots: function()
		{
			host.childNodes.forEach($assignSlot);
		}
	});

	return fragment;
}

function $extendSlot(slot, component)
{
	cxl.extend(slot, {
		$component: component,
		get firstChild()
		{
			return null;
		}
	});
}

cxl.ComponentFactory.prototype.$attachShadow = function(el) {
	var native = $extendShadow(el);

	$extendComponent(el, native);

	native.$updateSlots();

	return native;
};

const oldRegister = cxl.View.prototype.registerSlot;

Object.assign(cxl.View.prototype, {

	registerSlot(slot)
	{
		oldRegister.call(this, slot);

		const shadow = this.host.shadowRoot;

		shadow.$slots.push(slot.slot);
		$extendSlot(slot.slot, this.host);
		shadow.$updateSlots();
	}

});

})(this.cxl);