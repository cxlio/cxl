(cxl => {
"use strict";

if (window.customElements && !window.$$cxlShady)
	return;

var	started, scheduled;

const
	registry = {},
	observer = new MutationObserver(onMutation)
;

cxl.$$shadyUpgrade = node => walkChildren(node, upgradeConnect);
cxl.$$shadyCustomElements = true;

function upgrade(node)
{
	if (node.tagName && !node.$view)
	{
		const Component = registry[node.tagName];

		if (Component)
			new Component(node);
	}
}

function connect(node)
{
	node.$$connect=undefined;

	if (node.$$cxlConnected===false)
	{
		node.$view.connect();
		node.$$cxlConnected = true;
	}
}

function disconnect(node)
{
	node.$$connect = undefined;

	if (node.$$cxlConnected===true)
	{
		node.$view.disconnect();
		node.$$cxlConnected = false;
	}
}

function upgradeConnect(node)
{
	upgrade(node);
	connect(node);
}

function walkChildren(node, method)
{
	if (node.childNodes)
	{
		method(node);
		walk(node.firstChild, method);

		if (node.shadowRoot)
			walk(node.shadowRoot.firstChild, method);
	}

	return node;
}

function walk(node, method)
{
	if (node)
	{
		walkChildren(node, method);
		walk(node.nextSibling, method);
	}
}

function override(obj, fn)
{
	const original = obj[fn];
	obj[fn] = function() {
		const node = original.apply(this, arguments);

		if (node && node.childNodes)
			walkChildren(node, upgrade);

		return node;
	};
}

function onMutation(event)
{
	if (!started)
		return;

	const nodes = [];

	event.forEach(function(record) {
		for (var node of record.removedNodes)
		{
			if (node.tagName && node.$$connect===undefined)
				nodes.push(node);

			node.$$connect = disconnect;
		}

		for (node of record.addedNodes)
		{
			if (node.tagName && node.$$connect===undefined)
				nodes.push(node);

			node.$$connect = upgradeConnect;
		}
	});

	nodes.forEach(n => n.$$connect && walkChildren(n, n.$$connect));
}

function observe()
{
	walkChildren(document.body, upgradeConnect);
	observer.observe(document.body, { subtree: true, childList: true });
	started = true;
}

function debouncedWalk()
{
	if (scheduled)
		return;

	scheduled = true;
	setTimeout(() => {
		scheduled = false;
		walkChildren(document.body, upgradeConnect);
	});
}

Object.assign(cxl.ComponentDefinition.prototype, {

	$registerElement(name, Constructor) {
		registry[name.toUpperCase()] = Constructor;

		if (started)
			debouncedWalk();
	},

	componentConstructor(meta)
	{
		var me = this;

		class Component {
			constructor(node)
			{
				node.$$cxlConnected = false;

				if (meta.attributes)
					me.$attributes(node, meta.attributes);

				if (meta.methods)
					me.$methods(node, meta.methods);

				cxl.componentFactory.createComponent(meta, node);
			}
		}

		return Component;
	}

});

override(cxl.Template.prototype, 'clone');

const createElement = cxl.dom.createElement;

cxl.dom.createElement = function() {
	const result = createElement.apply(cxl, arguments);
	return walkChildren(result, upgrade);
};

/*const cloneNode = window.DocumentFragment.prototype.cloneNode;
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
	return deep ? doWalk(cloneDeep(this), upgrade) : cloneNode.call(this);
};

// TODO do this properly
/*document.importNode = function(node, deep)
{
	return deep ? doWalk(cloneDeep(node), upgrade) : importNode.call(this);
};*/

window.addEventListener('DOMContentLoaded', observe);

})(this.cxl);

(cxl => {
"use strict";

if (!window.$$cxlShady && window.Element.prototype.attachShadow)
	return;

cxl.$$shadyShadowDOM = true;

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
			$assignSlot(this, child);

			//this.shadowRoot.$updateSlots();
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

/*cxl.compiler.directives.content.prototype.createSlot = function()
{
	return this.element;
};*/

function $findSlot(host, child)
{
	const slot = (child.matches && (host.$view.slots && host.$view.slots.find(function(slot) {
		return child.matches && child.matches(slot.parameter);
	}))) || host.$view.defaultSlot;

	return slot && slot.slot;
}

function $assignSlot(host, child)
{
	// Assign Slots
	const slot = $findSlot(host, child);

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

function $extendShadow(host)
{
const
	fragment = {},
 	slots = []
;
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

		appendChild(child)
		{
			return this.insertBefore(child);
		},

		insertBefore(child, next)
		{
			if (child instanceof DocumentFragment)
			{
				while (child.firstChild)
					this.insertBefore(child.firstChild, next);

				return;
			}

			this.$insertBefore($extendChild(child), next);
		},

		removeChild(el)
		{
			return this.$removeChild(el);
		},

		$updateSlots()
		{
			host.childNodes.forEach(c => $assignSlot(host, c));
		}
	});

	return fragment;
}

const
	SLOT_INHERIT = [ 'display', 'align-items' ],
	isEdge = navigator.userAgent.indexOf('Edge')!==-1
;

function $extendSlot(slot, component)
{
	if (isEdge)
	{
		SLOT_INHERIT.forEach(style => slot.style[style]='inherit');
		slot.style.flexGrow = 1;
	}

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