(cxl => {
	'use strict';

	if (window.customElements && !window.$$cxlShady) return;

	var started, scheduled;

	const registry = {},
		observer = new MutationObserver(onMutation);
	cxl.$$shadyUpgrade = node => walkChildren(node, upgradeConnect);
	cxl.$$shadyCustomElements = true;

	function upgrade(node) {
		if (node.tagName && !node.$view) {
			const Component = registry[node.tagName];

			if (Component) new Component(node);
		}
	}

	function connect(node) {
		node.$$connect = undefined;

		if (node.$$cxlConnected === false) {
			node.$view.connect();
			node.$$cxlConnected = true;
		}
	}

	function disconnect(node) {
		node.$$connect = undefined;

		if (node.$$cxlConnected === true) {
			node.$view.disconnect();
			node.$$cxlConnected = false;
		}
	}

	function upgradeConnect(node) {
		upgrade(node);
		connect(node);
	}

	function walkChildren(node, method) {
		if (node.childNodes) {
			method(node);
			walk(node.firstChild, method);

			if (node.shadowRoot) walk(node.shadowRoot.firstChild, method);
		}

		return node;
	}

	function walk(node, method) {
		if (node) {
			walkChildren(node, method);
			walk(node.nextSibling, method);
		}
	}

	function override(obj, fn) {
		const original = obj[fn];
		obj[fn] = function() {
			const node = original.apply(this, arguments);

			if (node && node.childNodes) walkChildren(node, upgrade);

			return node;
		};
	}

	function onMutation(event) {
		if (!started) return;

		const nodes = [];

		event.forEach(function(record) {
			for (var node of record.removedNodes) {
				if (node.tagName && node.$$connect === undefined)
					nodes.push(node);

				node.$$connect = disconnect;
			}

			for (node of record.addedNodes) {
				if (node.tagName && node.$$connect === undefined)
					nodes.push(node);

				node.$$connect = upgradeConnect;
			}
		});

		nodes.forEach(n => n.$$connect && walkChildren(n, n.$$connect));
	}

	function observe() {
		walkChildren(document.body, upgradeConnect);
		observer.observe(document.body, { subtree: true, childList: true });
		started = true;
	}

	function debouncedWalk() {
		if (scheduled) return;

		scheduled = true;
		setTimeout(() => {
			scheduled = false;
			walkChildren(document.body, upgradeConnect);
		});
	}

	Object.assign(cxl.ComponentDefinition.prototype, {
		$registerElement(name, Constructor) {
			registry[name.toUpperCase()] = Constructor;

			if (started) debouncedWalk();
		},

		componentConstructor() {
			const me = this;

			class Component {
				constructor(node) {
					node.$$cxlConnected = false;

					if (me.meta.attributes)
						me.$attributes(node, me.meta.attributes);

					if (me.meta.methods) me.$methods(node, me.meta.methods);

					cxl.componentFactory.createComponent(me.meta, node);
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

	window.addEventListener('DOMContentLoaded', observe);
})(this.cxl);

(cxl => {
	'use strict';

	if (!window.$$cxlShady && window.Element.prototype.attachShadow) return;

	const directives = cxl.compiler.directives;
	cxl.$$shadyShadowDOM = true;

	Object.assign(cxl.css.StyleSheet.prototype, {
		$attachStyle: function() {
			this.$native = document.createElement('STYLE');
			document.head.appendChild(this.$native);
			this.$selector = this.tagName;
			this.$prefix = this.tagName + '--';
		}
	});

	cxl.dom.setStyle = function(el, className, enable, prefix) {
		el.classList[enable || enable === undefined ? 'add' : 'remove'](
			prefix + className
		);
	};

	// CSS Apply style with prefix
	directives[
		'style.animate'
	].prototype.initialize = directives.style.prototype.initialize = function() {
		this.prefix = this.owner.host
			? this.owner.host.tagName.toLowerCase() + '--'
			: '';
	};

	function $indexOf(child) {
		var parent = child.parentNode;

		if (!parent) return null;

		var i = Array.prototype.indexOf.call(parent.childNodes, child);

		if (i === -1) throw 'Invalid Node';

		return i;
	}

	function $extendChild(child) {
		if (child.$cxl) return child;

		const parentNode = Object.getOwnPropertyDescriptor(
			Node.prototype,
			'parentNode'
		);
		//	nextSibling = Object.getOwnPropertyDescriptor(Node.prototype, 'nextSibling')
		cxl.extend(child, {
			$cxl: true,

			get parentNode() {
				const parent = this.$parentNode;

				if (!parent) return this.$component || null;

				if (parent.tagName === 'SLOT' && parent.$component)
					return parent.$component;

				if (parent.shadowRoot) return parent.shadowRoot;

				return parent;
			},

			get nextSibling() {
				var i = $indexOf(this);
				return i !== null && this.parentNode.childNodes[i + 1];
			}
		});

		Object.defineProperty(child, '$parentNode', parentNode);

		return child;
	}

	cxl.extend(cxl.ElementChildren.prototype, {
		get first() {
			var el = this.el.childNodes[0];
			return el.tagName ? el : this.nextTo(el);
		},

		get last() {
			var el = this.el.childNodes[this.el.childNodes.length - 1];
			return el.tagName ? el : this.previousTo(el);
		},

		nextTo(el) {
			if (!this.el.$indexOf) return el.nextElementSibling;

			var i = this.el.$indexOf(el);

			do {
				i++;
				el = this.el.childNodes[i];
			} while (el && !el.tagName);

			return el;
		},

		previousTo(el) {
			if (!this.el.$indexOf) return el.previousElementSibling;

			var i = this.el.$indexOf(el);

			do {
				i--;
				el = this.el.childNodes[i];
			} while (el && !el.tagName);

			return el;
		}
	});

	function $extendComponent(component, shadow) {
		cxl.extend(component, {
			$appendChild: component.appendChild.bind(component),
			$removeChild: component.removeChild.bind(component),

			shadowRoot: shadow,
			childNodes: Array.prototype.slice.call(component.childNodes, 0),

			get firstChild() {
				return this.childNodes[0];
			},

			get lastChild() {
				return this.childNodes.length
					? this.childNodes[this.childNodes.length - 1]
					: null;
			},

			$indexOf(child) {
				var i = this.childNodes.indexOf(child);

				if (i === -1) throw 'Invalid Node';

				return i;
			},

			appendChild(child) {
				this.insertBefore(child);
			},

			insertBefore(child, next) {
				if (child instanceof DocumentFragment) {
					while (child.firstChild)
						this.insertBefore(child.firstChild, next);

					return;
				}

				if (next) this.childNodes.splice(this.$indexOf(next), 0, child);
				else this.childNodes.push(child);

				$extendChild(child);
				$assignSlot(this, child);

				//this.shadowRoot.$updateSlots();
			},

			removeChild(child) {
				this.childNodes.splice(this.$indexOf(child), 1);

				if (child.$parentNode) {
					child.$parentNode.removeChild(child);
					child.$component = null;
				}
			}
		});

		component.childNodes.forEach($extendChild);

		function isParent(child, component) {
			do {
				if (child === component) return true;
			} while ((child = child.parentNode));
		}

		function eventHandlerStop(ev) {
			if (ev.$$handled) return;

			ev.$$handled = true;

			if (isParent(ev.target, component)) return;

			ev.stopImmediatePropagation();
			ev.stopPropagation();
		}

		function eventHandler(ev) {
			if (ev.$$handled) return;

			ev.$$handled = true;

			if (isParent(ev.target)) return;

			Object.defineProperty(ev, 'target', { value: component });
		}

		const allowCross = [
			'onblur',
			'onfocus',
			'onfocusin',
			'onfocusout',
			'onclick',
			'ondblclick',
			'onmousedown',
			'onmouseenter',
			'onmouseleave',
			'onmousemove',
			'onmouseover',
			'onwheel',
			'onmouseout',
			'onmouseup',
			'ontouchstart',
			'ontouchend',
			'ontouchmove',
			'ontouchcancel',
			'onpointerenter',
			'onpointerdown',
			'onpointermove',
			'onpointerup',
			'onpointercancel',
			'onpointerout',
			'onpointerleave',
			'ongotpointercapture',
			'onlostpointercapture',
			'ondragenter',
			'ondragleave',
			'ondragover',
			'onkeypress',
			'onbeforeinput',
			'oninput',
			'onkeydown',
			'onkeyup',
			'oncompositionsstart',
			'oncompositionupdate',
			'oncompositionend',
			'ondragstart',
			'ondrag',
			'ondragend',
			'ondrop'
		];

		// Catch Events
		for (var prop in component)
			if (prop.indexOf('on') === 0)
				component.addEventListener(
					prop.slice(2),
					allowCross.indexOf(prop) === -1
						? eventHandlerStop
						: eventHandler,
					{ passive: true }
				);
	}

	function $findSlotByName(slots, name) {
		return slots.find(slot => name === slot.parameter);
	}

	function $findSlot(host, child) {
		const slots = host.$view.slots;

		if (slots) {
			const slotName = child.getAttribute && child.getAttribute('slot');

			const slot =
				(slotName && $findSlotByName(slots, slotName)) ||
				(child.matches &&
					slots.find(
						slot => slot.parameter && child.matches(slot.parameter)
					)) ||
				host.$view.defaultSlot;
			return slot && slot.slot;
		}
	}

	function $assignSlot(host, child) {
		// Assign Slots
		const slot = $findSlot(host, child);

		if (slot) slot.appendChild(child);
		else {
			if (child.$parentNode) {
				if (child.$parentNode === host) host.$removeChild(child);
				else child.$parentNode.removeChild(child);
			}

			child.$component = host;
		}
	}

	function $extendShadow(host) {
		const fragment = {},
			slots = [];
		cxl.extend(fragment, {
			childNodes: host.childNodes,
			parentNode: null,
			host: host,
			$slots: slots,
			$insertBefore: host.insertBefore.bind(host),
			$removeChild: host.removeChild.bind(host),

			get firstChild() {
				return this.childNodes[0];
			},

			appendChild(child) {
				return this.insertBefore(child);
			},

			insertBefore(child, next) {
				if (child instanceof DocumentFragment) {
					while (child.firstChild)
						this.insertBefore(child.firstChild, next);

					return;
				}

				this.$insertBefore($extendChild(child), next);
			},

			removeChild(el) {
				return this.$removeChild(el);
			},

			$updateSlots() {
				host.childNodes.forEach(c => $assignSlot(host, c));
			}
		});

		return fragment;
	}

	const SLOT_INHERIT = ['display', 'align-items'],
		isEdge = navigator.userAgent.indexOf('Edge') !== -1;

	function displayContentsFix(el) {
		SLOT_INHERIT.forEach(style => (el.style[style] = 'inherit'));
	}

	function $extendSlot(slot, component) {
		if (isEdge) {
			displayContentsFix(slot);
			slot.style.flexGrow = 1;
		}

		cxl.extend(slot, {
			$component: component,
			get firstChild() {
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
		registerSlot(slot) {
			oldRegister.call(this, slot);

			const shadow = this.host.shadowRoot;

			$extendSlot(slot.slot, this.host);

			if (shadow) {
				shadow.$slots.push(slot.slot);
				shadow.$updateSlots();
			}
		}
	});
})(this.cxl);