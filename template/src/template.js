(cxl => {
	'use strict';

	const ANCHORS = {},
		MAX_DIGEST = 9,
		PARAM_REGEX = /\:([\w_\$]+)/g,
		Undefined = {},
		Skip = {},
		GETTERS = {},
		SETTERS = {},
		rx = cxl.rx,
		dom = cxl.dom,
		bindRegex = /\s*([:|])?([^\w])?([^\(:\s>"'=\|]+)(?:\(([^\)]+)\))?(:|\|)?/g;

	class Renderer {
		constructor() {
			this.pipeline = [];
			this.raf = null;
			this.commit = this.$commit.bind(this);
		}

		$doDigest(b, view) {
			let newVal = b.digest(view.state);

			if (b.value !== newVal) {
				b.set(newVal);
				return true;
			}
		}

		digestBinding(b, view) {
			try {
				return this.$doDigest(b, view);
			} catch (e) {
				// Ignore Errors on Prod mode
			}
		}

		commitDigest(view) {
			var i,
				b = view.bindings,
				changed = true,
				count = 0,
				binding;

			while (changed) {
				changed = false;

				for (i = 0; i < b.length; ++i) {
					binding = b[i];

					if (binding.digest && this.digestBinding(binding, view))
						changed = true;
				}

				if (count++ > MAX_DIGEST)
					throw new Error('Max digest cycle iterations reached.');
			}

			view.$dirty = false;
		}

		$commit() {
			const pipeline = this.pipeline;

			for (let i = 0; i < pipeline.length; ++i)
				this.commitDigest(pipeline[i]);

			pipeline.length = 0;

			this.raf = null;
		}

		request() {
			if (this.raf === null)
				this.raf = requestAnimationFrame(this.commit);
		}

		digest(view) {
			if (!view.$dirty) {
				view.$dirty = true;
				this.pipeline.push(view);
				this.request();
			}
		}

		cancel() {
			cancelAnimationFrame(this.raf);
		}
	}

	const renderer = new Renderer();

	class Directive {
		constructor(element, parameter, owner) {
			this.element = element;
			this.parameter = parameter;
			this.owner = owner;

			if (this.initialize) this.initialize(element, parameter, owner);

			if (this.connect && this.owner.isConnected)
				this.connect(this.owner.state);
		}

		subscribe(subscriber) {
			this.subscriber = subscriber;
			return this;
		}

		doConnect() {
			if (this.connect) this.connect(this.owner.state);

			this.connected = true;

			if (this.subscriber && this.subscriber.doConnect)
				this.subscriber.doConnect();
		}

		destroy() {
			if (this.disconnect) this.disconnect();

			if (this.subscriber && this.subscriber.destroy)
				this.subscriber.destroy();

			// SUpport for both Destroyable and Observable objects.
			if (this.bindings)
				this.bindings.forEach(b =>
					b.destroy ? b.destroy() : b.unsubscribe()
				);

			this.bindings = null;

			this.connected = false;
		}

		error(e) {
			if (this.subscriber) this.subscriber.error(e);

			this.destroy();
		}

		set(newVal) {
			this.value = newVal;

			if (this.connected === false) return;

			if (this.owner) this.owner.digest();

			if (this.subscriber) this.subscriber.next(this.value);

			if (this.once) this.destroy();
		}

		next(val) {
			var newVal;

			if (this.update)
				newVal = this.update(val, this.owner && this.owner.state);

			if (newVal === Skip) return;

			if (newVal instanceof Promise)
				newVal.then(this.set.bind(this), this.error.bind(this));
			else this.set(newVal === undefined ? val : newVal);
		}

		clone() {
			var result = new this.constructor(
				this.element,
				this.parameter,
				this.owner
			);

			result.once = this.once;

			return result;
		}
	}

	Object.assign(Directive.prototype, {
		value: Undefined,
		once: false
	});

	class EventListener {
		constructor(element, event, handler, options) {
			this.destroy = dom.on(element, event, handler, options);
		}
	}

	class Store {
		constructor(State) {
			this.bindings = [];
			this.state =
				typeof State === 'function' ? new State() : State || {};
		}

		set(property, value) {
			if (value !== this.state[property]) {
				this.state[property] = value;
				renderer.digest(this);
			}
		}

		observe(path) {
			const directive = new cxl.compiler.directives.state(
				this.host,
				path,
				this
			);
			this.bindings.push(directive);
			return directive;
		}

		digest() {
			renderer.digest(this);
		}

		destroy() {
			this.bindings.forEach(b => b.destroy());
		}
	}

	class View extends Store {
		constructor(State, host) {
			super(State);
			this.host = host;

			this.connected = new rx.Subject();
		}

		setAttribute(name, newVal) {
			this.set(name, newVal === '' ? true : newVal || false);
		}

		registerSlot(slot) {
			if (!slot.parameter) this.defaultSlot = slot;

			if (!this.slots) this.slots = [];

			this.slots.push(slot);
		}

		connect() {
			// Set as connected so bindings added by template directives
			// Auto connect
			this.isConnected = true;

			if (this.bindings.length) {
				this.bindings.forEach(b => b.doConnect());
				cxl.renderer.commitDigest(this);
			}

			this.connected.next(true);
		}

		disconnect() {
			if (this.bindings.length) renderer.commitDigest(this);
			this.isConnected = false;
			this.connected.next(false);
			this.destroy();
		}
	}

	/**
	 * Creates References and Bindings.
	 */
	class Compiler {
		constructor() {
			this.directives = {};
			this.shortcuts = {
				'=': 'state',
				'#': 'call',
				$: 'item',
				'@': 'getset'
			};
		}

		directiveNotFound(directive) {
			throw new Error('Directive "' + directive + '" not found.');
		}

		getDirective(parsed, element, owner) {
			var shortcut = parsed[2],
				name = parsed[3],
				param = parsed[4],
				directive = shortcut && this.shortcuts[shortcut],
				Ref,
				result;
			if (directive) param = name;
			else directive = name;

			Ref = this.directives[directive];

			if (!Ref) this.directiveNotFound(directive, element, owner);

			result = new Ref(element, param, owner);

			return result;
		}

		createBinding(refA, refB, modifier, owner) {
			var twoway = modifier === ':',
				once = modifier === '|',
				clone;
			if (once) refA.once = true;

			if (refA) {
				refA.subscribe(refB);

				if (twoway) {
					clone = refA.clone();
					refB.subscribe(clone);

					owner.bindings.push(refB);
				}
			} else if (refB) owner.bindings.push(refB);
		}

		parseBinding(element, bindingText, owner) {
			var parsed, refA, refB, index;

			bindRegex.lastIndex = 0;

			while ((parsed = bindRegex.exec(bindingText))) {
				index = bindRegex.lastIndex;
				refB = this.getDirective(parsed, element, owner);
				this.createBinding(refA, refB, parsed[1], owner);

				refA = parsed[5] && refB;

				bindRegex.lastIndex = index;
			}
		}

		compile(node, owner) {
			var binding = node.getAttribute && node.getAttribute('&');

			if (binding) this.parseBinding(node, binding, owner);

			if (node.firstChild) this.traverse(node.firstChild, owner);
		}

		traverse(node, owner) {
			const next = node.nextSibling;

			this.compile(node, owner);

			if (next) this.traverse(next, owner);
		}
	}

	const compiler = new Compiler();

	class Template {
		static fromId(id) {
			return new Template(document.getElementById(id).innerHTML);
		}

		static getFragmentFromString(content) {
			// We use <template> so components are not initialized
			const template = document.createElement('TEMPLATE');
			template.innerHTML = content.trim();
			return template.content;
		}

		static getFragment(content) {
			if (typeof content === 'string')
				return Template.getFragmentFromString(content);

			if (content instanceof window.Element) {
				if (content.tagName === 'TEMPLATE' && content.content)
					return content.content;

				content = content.childNodes;
			}

			var result = document.createDocumentFragment();

			while (content.length) result.appendChild(content[0]);

			return result;
		}

		constructor(content) {
			this.$content = dom.normalize(Template.getFragment(content));
		}

		clone() {
			return document.importNode(this.$content, true);
		}

		compile(owner) {
			const nodes = this.clone();

			if (nodes.childNodes.length)
				compiler.traverse(nodes.firstChild, owner);

			return nodes;
		}
	}

	class NodeSnapshot {
		constructor(nodes) {
			this.nodes = [];

			for (var n of nodes) this.nodes.push(n);
		}

		appendTo(el) {
			this.nodes.forEach(n => el.appendChild(n));
		}

		remove() {
			this.nodes.forEach(
				n => n.parentNode && n.parentNode.removeChild(n)
			);
		}
	}

	class MutationEvent extends rx.Event {}

	class AttributeObserver extends rx.Subject {
		$onMutation(events) {
			events.forEach(ev => this.trigger(ev.attributeName));
		}

		$onEvent() {
			if (this.element.value !== this.$value) {
				this.$value = this.element.value;
				this.trigger('value');
			}

			if (this.element.checked !== this.$checked) {
				this.$checked = this.element.checked;
				this.trigger('checked');
			}
		}

		$initializeNative(element) {
			this.observer = new MutationObserver(this.$onMutation.bind(this));
			this.observer.observe(element, { attributes: true });

			this.bindings = [
				new EventListener(element, 'change', this.$onEvent.bind(this))
			];
		}

		constructor(element) {
			if (element.$$attributeObserver) return element.$$attributeObserver;

			super();

			this.element = element;
			element.$$attributeObserver = this;
		}

		onSubscribe() {
			// Use mutation observer for native dom elements
			if (!this.element.$view && !this.observer)
				this.$initializeNative(this.element);
		}

		unsubscribe(s) {
			super.unsubscribe(s);

			if (this.__subscribers.length === 0) this.disconnect();
		}

		disconnect() {
			if (this.observer) {
				this.observer.disconnect();
				this.bindings.forEach(b => b.destroy());
			}
		}

		trigger(attributeName) {
			this.next(
				new MutationEvent('attribute', this.element, attributeName)
			);
		}

		destroy() {
			super.destroy();
			this.disconnect();
		}
	}

	class Marker {
		constructor(element, text) {
			const parent = element.parentNode;

			this.node = document.createComment(text || '');
			this.children = [];
			this.element = element;
			parent.insertBefore(this.node, element);
			dom.remove(element);
			// TODO. Used by marker.empty directive
			element.$marker = this;
		}

		toggle(val, removeTo) {
			const el = this.element;

			if (val) this.node.parentNode.insertBefore(el, this.node);
			else {
				if (removeTo) removeTo.appendChild(el);
				else cxl.dom.remove(el);
			}
		}

		insert(content, nextNode) {
			// TODO performance.
			this.children.push(new NodeSnapshot(content.childNodes));
			this.node.parentNode.insertBefore(content, nextNode || this.node);
		}

		empty() {
			this.children.forEach(snap => snap.remove());
			this.children = [];
		}
	}

	class ChildrenObserver extends rx.Subject {
		$event(type, el) {
			return new MutationEvent(type, this.element, el);
		}

		$trigger(type, nodes) {
			for (let el of nodes) this.next(this.$event(type, el));
		}

		$handleEvent(ev) {
			this.$trigger('added', ev.addedNodes);
			this.$trigger('removed', ev.removedNodes);
		}

		$onEvents(events) {
			events.forEach(this.$handleEvent, this);
		}

		constructor(element) {
			if (element.$$childrenObserver) return element.$$childrenObserver;

			super();
			this.element = element;
			element.$$childrenObserver = this;
		}

		onSubscribe() {
			if (!this.observer) {
				this.observer = new MutationObserver(this.$onEvents.bind(this));
				this.observer.observe(this.element, { childList: true });
			}
		}

		unsubscribe(s) {
			super.unsubscribe(s);

			if (this.__subscribers.length === 0) this.observer.disconnect();
		}

		destroy() {
			super.destroy();
			this.observer.disconnect();
		}
	}

	function directive(name, Fn, shortcut) {
		if (typeof Fn !== 'function') Fn = cxl.extendClass(Directive, Fn, name);

		if (shortcut) compiler.shortcuts[shortcut] = name;

		return (compiler.directives[name] = Fn);
	}

	directive('value', {
		initialize() {
			// Prevent value from digesting
			this.value = this.element.value;
		},

		connect() {
			var owner = this.owner;

			function onChange() {
				renderer.digest(owner);
			}

			this.bindings = [
				new EventListener(this.element, 'change', onChange),
				new EventListener(this.element, 'input', onChange)
			];
		},

		update(val) {
			if (this.element.value !== val) this.element.value = val;
		},

		digest() {
			return this.element.value;
		}
	});

	directive('owner', {
		digest() {
			return this.owner;
		}
	});

	directive('ref.get', {
		initialize() {
			this.bindings = [
				this.owner.observe(this.parameter).subscribe(this)
			];
		},

		update(ref) {
			if (this.subscription) this.subscription.unsubscribe();

			if (ref)
				this.bindings[1] = this.subscription = ref.subscribe(
					this.set.bind(this)
				);

			return Skip;
		}
	});

	directive('ref.set', {
		initialize() {
			this.getter = cxl.getter(this.parameter);
		},

		update(val, state) {
			const ref = this.getter(state);
			// TODO reference should always be set?
			if (ref && this.value !== val) ref.set(val);
		}
	});

	directive(
		'ref.val',
		{
			initialize() {
				this.getter = cxl.getter(this.parameter);
				this.bindings = [
					this.owner.observe(this.parameter).subscribe({
						next: this.setup.bind(this),
						destroy: this.destroySubscription.bind(this)
					})
				];
			},

			destroySubscription() {
				this.subscription.unsubscribe();
			},

			setup(ref) {
				if (this.subscription) this.destroySubscription();

				this.reference = ref;

				if (ref)
					this.bindings[1] = this.subscription = ref.subscribe(
						this.onValue.bind(this)
					);
			},

			onValue(val) {
				this.set(val);
			},

			update(val, state) {
				const ref = this.getter(state);
				// TODO reference should always be set?
				if (ref && this.value !== val) ref.set(val);
			}
		},
		'&'
	);

	directive('get', {
		update(val, state) {
			return this.digest(state);
		},

		digest(state) {
			this.digest = cxl.getter(this.parameter);
			return this.digest(state);
		}
	});

	directive('state', {
		update(val, state) {
			this.update = cxl.setter(this.parameter);
			return this.update(val, state);
		},

		digest(state) {
			if (this.parameter) {
				this.digest = cxl.getter(this.parameter);
				return this.digest(state);
			}

			return state;
		}
	});

	directive(
		'style',
		{
			update(val) {
				if (!this.parameter) {
					if (this.oldValue !== val)
						dom.setStyle(
							this.element,
							this.oldValue,
							false,
							this.prefix
						);
					this.oldValue = val;
				}

				dom.setStyle(
					this.element,
					this.parameter || val,
					val || false,
					this.prefix
				);
			},
			digest() {
				this.update(true);
				this.digest = null;
			}
		},
		'.'
	);

	directive('getset', {
		update(val) {
			this.element[this.parameter || val] = val;
		},

		$digest() {
			return this.element[this.parameter];
		},

		onMutation(ev) {
			if (ev.type === 'attribute' && ev.value === this.parameter)
				this.owner.digest();
		},

		digest() {
			var observer = (this.observer = new AttributeObserver(
				this.element
			));

			this.bindings = [observer.subscribe(this.onMutation.bind(this))];

			this.digest = this.$digest;

			return this.element[this.parameter];
		}
	});

	directive('item', {
		initialize() {
			this.item = this.owner.state.$item;
		},

		update(val) {
			if (this.parameter) this.item[this.parameter] = val;
			else this.owner.state.$item = val;
		},

		digest() {
			return this.parameter ? this.item[this.parameter] : this.item;
		}
	});

	directive('item.each', {
		each(value, key) {
			const item = new rx.Item(value, key);
			item.index = this.index++;
			this.subscriber.next(item);
		},

		set(val) {
			this.value = val;
			this.index = 0;

			if (this.subscriber) cxl.each(val, this.each, this);

			if (this.once) this.destroy();
		}
	});

	directive('each', {
		each(item) {
			this.subscriber.next(item);
		},

		set(val) {
			this.value = val;

			if (this.subscriber) cxl.each(val, this.each, this);

			if (this.once) this.destroy();
		}
	});

	// TODO
	directive('each.list', {
		value: null,

		notify(subscriber, oldList, list) {
			if (!list) return subscriber.next({ type: 'empty' });
			const keys = Object.keys(list);

			// TODO performance
			cxl.each(oldList, (value, key) => {
				const index = keys.indexOf(key.toString()),
					event =
						index !== -1
							? {
									type: 'changed',
									value: list[key],
									oldValue: value,
									nextValue: list[keys[index + 1]]
							  }
							: { type: 'removed', value: value };
				subscriber.next(event);
			});

			cxl.each(list, (value, key) => {
				const index = keys.indexOf(key.toString());

				if (!oldList || !(key in oldList))
					subscriber.next({
						type: 'added',
						value: value,
						nextValue: list[keys[index + 1]]
					});
			});
		},

		update(list) {
			const oldList = this.value,
				subscriber = this.subscriber;
			this.value = list;

			if (subscriber) this.notify(subscriber, oldList, list);

			return Skip;
		}
	});

	class ElementChildren {
		constructor(element) {
			if (element.$elementChildren) return element.$elementChildren;

			this.el = element;
		}

		get first() {
			return this.el.firstElementChild;
		}
		get last() {
			return this.el.lastElementChild;
		}
		get focused() {
			return this.el.querySelector(':focus');
		}

		nextTo(el) {
			return el && el.nextElementSibling;
		}
		previousTo(el) {
			return el && el.previousElementSibling;
		}
	}

	class ElementList {
		constructor(element, owner) {
			this.items = new Map();
			this.template = new Template(element);
			this.marker = new Marker(element, 'list');
			this.owner = owner;
		}

		add(item, next) {
			this.owner.state.$item = item;
			const nextNode = next && this.items.get(next),
				fragment = this.template.compile(this.owner);
			this.items.set(item, new NodeSnapshot(fragment.childNodes));
			// cxl.renderer.commitDigest(this.owner);
			this.marker.insert(fragment, nextNode && nextNode.nodes[0]);
		}

		change(item, oldItem) {
			// TODO Find a better way
			// TODO Implement reordering
			this.owner.bindings.forEach(b => {
				if (b.item === oldItem) b.item = item;
			});

			if (item !== oldItem) {
				if (!this.items.has(oldItem)) throw new Error('Invalid item');

				this.items.set(item, this.items.get(oldItem));
				this.items.delete(oldItem);
			}
		}

		remove(item) {
			this.items.get(item).remove();
			this.items.delete(item);
		}

		empty() {
			if (this.items.size) {
				this.items.forEach(item => item.remove());
				this.items.clear();
			}
		}

		destroy() {
			this.items.clear();
		}
	}

	directive('list', {
		initialize() {
			this.bindings = [
				(this.list = new ElementList(this.element, this.owner))
			];
		},

		update(event) {
			if (event.type === 'added')
				this.list.add(event.value, event.nextValue);
			else if (event.type === 'removed') this.list.remove(event.value);
			else if (event.type === 'changed')
				this.list.change(event.value, event.oldValue, event.nextValue);
			else if (event.type === 'empty') this.list.empty();
		}
	});

	directive('list.sort', {
		initialize() {
			this.order = [];
			this.getter = this.parameter && cxl.getter(this.parameter);
		},
		findNext(val) {
			const i = this.order.findIndex(c => c > val);
			this.order.splice(i, 0, val, i);
		},
		update(event) {
			if (event.type === 'added') {
				const val = this.getter
					? this.getter(event.value)
					: event.value;
				event.next = this.findNext(val);
			}
		}
	});

	directive('list.count', {
		value: 0,
		update(event) {
			if (event.type === 'added') this.value++;
			else if (event.type === 'removed') this.value--;
			else if (event.type === 'empty') this.value = 0;

			return this.value;
		}
	});

	directive('id', {
		initialize() {
			if (this.parameter) this.update(this.parameter, this.owner.state);
		},

		update(val, state) {
			state[val] = this.element;
		}
	});

	directive('content', {
		initialize() {
			const component = this.owner.host,
				slot = (this.slot = this.createSlot());
			if (this.parameter) {
				this.observer = new ChildrenObserver(component);
				slot.name = this.parameter;
			}

			this.owner.registerSlot(this);

			if (this.element !== slot) this.element.appendChild(slot);
		},

		createSlot() {
			return this.element.tagName === 'SLOT'
				? this.element
				: document.createElement('SLOT');
		},

		connect() {
			if (this.parameter) {
				this.bindings = [
					this.observer.subscribe(this.onMutation.bind(this))
				];

				// Initialize children slots
				for (var node of this.owner.host.childNodes)
					this.assignSlot(node);
			}
		},

		assignSlot(node) {
			var sel = this.parameter;

			if (node.matches && node.matches(sel)) {
				node.slot = sel;
				// Fire directive only if subscriber found
				if (this.subscriber) this.set(node);
			}
		},

		onMutation(ev) {
			if (ev.type === 'added') this.assignSlot(ev.value);
		}
	});

	directive('action', {
		onEvent(ev) {
			this.set(ev);
		},

		onKeyPress(ev) {
			// Prevent double firing for links, Enter key generates a click event.
			if (
				(this.element.tagName !== 'A' && ev.key === 'Enter') ||
				ev.key === ' '
			)
				this.onEvent(ev);
		},

		connect() {
			this.bindings = [
				new EventListener(
					this.element,
					'click',
					this.onEvent.bind(this)
				),
				new EventListener(
					this.element,
					'keyup',
					this.onKeyPress.bind(this)
				)
			];
		}
	});

	directive('action.disable', {
		update(val) {
			this.element.style.pointerEvents = val ? 'none' : '';
		}
	});

	class Anchor {
		$create(name, el) {
			this.name = name;
			this.element = el;
			ANCHORS[name] = this;
		}

		constructor(name, el) {
			this.$create(name, el);
		}

		focus() {
			this.element.scrollIntoView();
			this.element.focus();
		}

		insert(element) {
			this.element.appendChild(element);
		}

		destroy() {
			if (ANCHORS[this.name] === this) delete ANCHORS[this.name];
		}
	}

	/**
	 * Anchors are used to interact with elements outside the component.
	 */
	directive('anchor', {
		initialize() {
			if (this.parameter) this.update(this.parameter);
		},
		connect() {
			if (!this.anchor) this.update(this.parameter);
		},
		disconnect() {
			this.anchor.destroy();
			this.anchor = null;
		},
		update(val) {
			if (this.anchor) this.anchor.destroy();

			if (val) {
				this.parameter = val;
				this.anchor = new Anchor(val, this.element);
			}
		}
	});

	directive('anchor.send', {
		connect() {
			//if (this.element === this.owner.host)
			//	throw new Error("Cannot use host element");
			if (!this.anchor) {
				const anchor = (this.anchor = cxl.anchor(this.parameter));
				anchor.insert(this.element);
				this.placed = true;
			}
		},

		disconnect() {
			if (this.placed) {
				cxl.dom.remove(this.element);
				this.placed = false;
			}
		}
	});

	directive('call', {
		update(val, state) {
			return state[this.parameter].call(state, val, this.element);
		},
		digest(state) {
			return state[this.parameter].call(state, this.value, this.element);
		}
	});

	function EventObservable(el, event) {
		return new rx.Observable(subscriber => {
			el.addEventListener(event, subscriber.next);
			return el.removeEventListener.bind(el, subscriber.next);
		});
	}

	Object.assign(cxl, {
		/// Initial value for directives
		Undefined: Undefined,
		/// Return this in a directive update function to stop the observable.
		Skip: Skip,

		ENTITIES_REGEX: /[&<]/g,
		ENTITIES_MAP: {
			'&': '&amp;',
			'<': '&lt;'
		},

		Anchor: Anchor,
		AttributeObserver: AttributeObserver,
		ChildrenObserver: ChildrenObserver,
		Compiler: Compiler,
		Directive: Directive,
		ElementChildren: ElementChildren,
		ElementList: ElementList,
		Event: Event,
		EventObservable: EventObservable,
		EventListener: EventListener,
		HTMLElement: window.HTMLElement,
		Marker: Marker,
		NodeSnapshot: NodeSnapshot,
		Template: Template,
		View: View,

		anchor(name) {
			return ANCHORS[name];
		},

		behavior: behavior,
		compiler: compiler,
		directive: directive,

		replaceParameters(path, params) {
			if (params === null || params === undefined) return path;

			if (typeof params !== 'object') params = { $: params };

			return path.replace(PARAM_REGEX, (match, key) => params[key]);
		},

		debounceRender(fn) {
			let raf = null;

			function Result() {
				const args = arguments,
					thisVal = this;

				if (raf === null)
					raf = requestAnimationFrame(() => {
						raf = null;
						Result.fn.apply(thisVal, args);
					});
			}
			Result.fn = fn;
			Result.cancel = function() {
				cancelAnimationFrame(raf);
			};

			return Result;
		},

		debounce(fn, delay) {
			var to;

			function Result() {
				var args = arguments,
					thisVal = this;

				if (to) clearTimeout(to);
				to = setTimeout(function() {
					Result.fn.apply(thisVal, args);
				}, delay);
			}
			Result.fn = fn;
			Result.cancel = function() {
				clearTimeout(to);
			};

			return Result;
		},

		each(coll, fn, scope) {
			if (Array.isArray(coll)) return coll.forEach(fn, scope);

			for (const i in coll)
				if (coll.hasOwnProperty(i)) fn.call(scope, coll[i], i);
		},

		escape(str) {
			return (
				str && str.replace(cxl.ENTITIES_REGEX, e => cxl.ENTITIES_MAP[e])
			);
		},

		/** Returns a getter function with a state parameter */
		getter(expr) {
			/*jshint evil:true*/
			return (
				GETTERS[expr] ||
				(GETTERS[expr] =
					expr.indexOf('.') === -1
						? state => state[expr]
						: new Function(
								'state',
								`try{return(state.${expr});}catch(e){return null;}`
						  ))
			);
		},

		pull(ary, item) {
			const i = ary.indexOf(item);

			if (i === -1) throw 'Invalid Item';

			ary.splice(i, 1);
		},

		/** Returns a setter function with value and state parameters */
		setter(expr) {
			/*jshint evil:true*/
			return (
				SETTERS[expr] ||
				(SETTERS[expr] =
					expr.indexOf('.') === -1
						? (val, state) => (state[expr] = val)
						: new Function('val', 'state', `state.${expr}=val;`))
			);
		},

		sortBy(A, key) {
			return A.sort((a, b) =>
				a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0
			);
		},

		renderer: renderer
	});

	function source(name, subscribe) {
		directive(name, {
			connect() {
				// TODO last parameter should be subscriber, using "this" so
				// "once" logic works properly
				var teardown = subscribe(
					this.element,
					this.parameter,
					this.owner,
					this
				);

				if (typeof teardown === 'function')
					teardown = { unsubscribe: teardown };

				this.bindings = [teardown];
			}
		});
	}

	function sources(defs) {
		for (var i in defs) source(i, defs[i]);
	}

	directive('connect', {
		connect() {
			this.set(true);
		}
	});
	directive('disconnect', {
		disconnect() {
			this.set(true);
		}
	});

	sources({});

	function connectedSources(defs) {
		for (var i in defs) source(i, defs[i]);
	}

	directive('on.message', {
		initialize(el, param) {
			new EventListener(el, param, this.set.bind(this));
		}
	});

	directive('input.state', {
		connect() {
			const el = this.element,
				apply = cxl.debounce(target =>
					this.set({
						invalid: target.invalid,
						focused: target.focused,
						touched: target.touched,
						disabled: target.disabled
					})
				),
				fn = ev => apply(ev.target);
			this.bindings = [
				new EventListener(el, 'invalid', fn),
				new EventListener(el, 'focus', fn),
				new EventListener(el, 'blur', fn)
			];
		}
	});

	connectedSources({
		/**
		 * Binds to DOM element event.
		 */
		on(el, param, view, subscriber) {
			return new EventListener(
				el,
				param,
				subscriber.next.bind(subscriber)
			);
		},

		keypress(el, param, view, subscriber) {
			if (param === 'space') param = ' ';

			return new EventListener(el, 'keydown', ev => {
				if (!param || ev.key.toLowerCase() === param)
					subscriber.next(ev);
			});
		},

		'host.mutation'(el, param, view, subs) {
			const observer = new ChildrenObserver(view.host);
			return observer.subscribe(subs.next.bind(subs));
		},

		location(el, param, view, subs) {
			subs.next(window.location.hash);

			return new EventListener(window, 'hashchange', () => {
				subs.next(window.location.hash);
			});
		},

		'root.on'(el, param, view, subs) {
			return new EventListener(window, param, subs.next.bind(subs));
		},

		timer(el, param, view, subs) {
			var value = 1,
				delay = param ? view.state[param] : 1000,
				interval = setInterval(() => subs.next(value++), delay);
			return clearInterval.bind(window, interval);
		}
	});

	function operator(name, fn) {
		directive(name, function(el, param, view) {
			const d = new Directive();
			d.update = fn(el, param, view);
			return d;
		});
	}

	function operators(defs) {
		for (var i in defs) operator(i, defs[i]);
	}

	operators({
		repeat(el, param, view) {
			const tpl = new Template(el),
				marker = new Marker(el, 'repeat');
			return item => {
				view.state.$item = item;
				const html = tpl.compile(view);
				marker.insert(html);
			};
		}
	});

	function pipes(defs) {
		for (var i in defs) directive(i, { update: defs[i] });
	}

	/**
	 * Pipes are update only directives
	 */
	pipes({
		attribute(val) {
			return cxl.dom.setAttribute(
				this.element,
				this.parameter || val,
				val
			);
		},

		bool(val) {
			return val !== undefined && val !== null && val !== false;
		},

		data(val) {
			this.element.dataset[this.parameter] = val;
		},

		empty() {
			cxl.dom.empty(this.element);
		},

		'dom.remove'(el) {
			cxl.dom.remove(el);
		},

		'event.prevent'(ev) {
			ev.preventDefault();
		},

		'event.stop'(ev) {
			ev.stopPropagation();
		},

		'event.halt': dom.event.halt,

		filter(val) {
			return val || cxl.Skip;
		},

		focus(val) {
			if (val) this.element.focus();
		},

		gate(val, state) {
			return state[this.parameter] ? val : Skip;
		},

		'focus.gate'(ev, state) {
			if (!state[this.parameter]) {
				dom.event.halt(ev);
				return Skip;
			}
		},

		'focus.enable'(value) {
			if (value) this.element.tabIndex = 0;
			else this.element.removeAttribute('tabindex');
		},

		hide(value) {
			this.element.style.display = value ? 'none' : '';
		},

		'host.trigger'(detail) {
			dom.trigger(this.owner.host, this.parameter, detail);
		},

		insert(value) {
			dom.insert(this.element, value);
		},

		'list.loading'(event) {
			const newVal = event.type === 'empty';
			// TODO ?
			return newVal === this.value ? cxl.Skip : newVal;
		},

		observe(observable) {
			if (this.bindings) this.bindings[0].unsubscribe();

			if (observable)
				this.bindings = [observable.subscribe(this.set.bind(this))];

			return cxl.Skip;
		},

		// TODO
		'marker.empty'() {
			if (this.element.$marker) this.element.$marker.empty();
		},

		not(value) {
			return !value;
		},

		prop(obj) {
			const res = obj && obj[this.parameter];
			return res === undefined ? null : res;
		},

		replace(val, state) {
			return cxl.replaceParameters(state[this.parameter], val);
		},

		resolve(promise) {
			return promise;
		},

		reverse(val) {
			return val && val.reverse();
		},

		show(value) {
			this.element.style.display = value ? '' : 'none';
		},

		sort(value) {
			return this.parameter
				? cxl.sortBy(value, this.parameter)
				: value && value.sort();
		},

		'style.inline'(val) {
			this.element.style[this.parameter] = val;
		},

		'style.animate'() {
			dom.setStyle(this.element, this.parameter, false, this.prefix);
			requestAnimationFrame(() => {
				dom.setStyle(this.element, this.parameter, true, this.prefix);
			});
		},

		text(value) {
			dom.setContent(this.element, value);
		},

		toggle(val, state) {
			return (state[this.parameter] = !state[this.parameter]);
		}
	});

	cxl.anchor.anchors = ANCHORS;

	/**
	 * Behaviors are directives with independent state
	 */
	function behavior(name, def) {
		if (typeof def === 'string') def = { bindings: def };

		directive(name, {
			initialize(el) {
				const state = Object.assign({}, def),
					view = (this.view = new View(state, el));
				// TODO keep this here?
				state.$behavior = this;
				compiler.parseBinding(el, state.bindings, view);
				this.bindings = view.bindings;
			},

			connect() {
				this.view.connect();
			},
			disconnect() {
				this.view.disconnect();
			}
		});
	}
})(this.cxl);
