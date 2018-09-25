(cxl => {
"use strict";

const
	ANCHORS = {},
	//TEMPLATES = {},
	MAX_DIGEST = 9,
	PARAM_REGEX = /\:([\w_\$]+)/g,

	Undefined = {},
	Skip = {},
	GETTERS = {},
	SETTERS = {},
	rx = cxl.rx,

	bindRegex = /\s*([:|])?([^\w])?([^\(:\s>"'=\|]+)(?:\(([^\)]+)\))?(:|\|)?/g
;

class Renderer {

	constructor()
	{
		this.pipeline = [];
		this.commit = this.$commit.bind(this);
	}

	$doDigest(b, view)
	{
		let newVal = b.digest(view.state);

		if (b.value !== newVal)
		{
			b.set(newVal);
			return true;
		}
	}

	digestBinding(b, view)
	{
		try {
			return this.$doDigest(b, view);
		}
		catch(e)
		{
			// Ignore Errors on Prod mode
		}
	}

	commitDigest(view)
	{
		var i, b = view.bindings, changed=true, count=0, binding;

		while (changed)
		{
			changed = false;

			if (count++>MAX_DIGEST)
				throw new Error("Max digest cycle iterations reached.");

			for (i=0; i<b.length; i++)
			{
				binding = b[i];

				if (binding.digest && this.digestBinding(binding, view))
					changed = true;
			}
		}

		view.$dirty = false;
	}

	$commit()
	{
		var view;

		while ((view=this.pipeline.shift()))
			this.commitDigest(view);

		this.raf = null;
	}

	request()
	{
		return this.raf || (this.raf = requestAnimationFrame(this.commit));
	}

	digest(view)
	{
		if (!view.$dirty)
		{
			view.$dirty = true;
			this.pipeline.push(view);
			this.request();
		}
	}

	cancel()
	{
		cancelAnimationFrame(this.raf);
	}

}

const renderer = new Renderer();

class Directive
{
	constructor(element, parameter, owner)
	{
		this.element = element;
		this.parameter = parameter;
		this.owner = owner;

		if (this.initialize) this.initialize(element, parameter, owner);

		if (this.connect && this.owner.isConnected)
			this.connect(this.owner.state);
	}

	subscribe(subscriber)
	{
		this.subscriber = subscriber;
		return subscriber;
	}

	doConnect()
	{
		if (this.connect)
			this.connect(this.owner.state);

		if (this.subscriber && this.subscriber.doConnect)
			this.subscriber.doConnect();
	}

	destroy()
	{
		if (this.subscriber && this.subscriber.destroy)
			this.subscriber.destroy();

		// SUpport for both Destroyable and Observable objects.
		if (this.bindings)
			this.bindings.forEach(b => b.destroy ? b.destroy() : b.unsubscribe());

		this.bindings = null;

		if (this.disconnect)
			this.disconnect();
	}

	error(e)
	{
		if (this.subscriber)
			this.subscriber.error(e);

		this.destroy();
	}

	set(newVal)
	{
		this.value = newVal;

		if (this.owner)
			this.owner.digest();

		if (this.subscriber)
			this.subscriber.next(this.value);

		if (this.once)
			this.destroy();
	}

	next(val)
	{
		var newVal;

		if (this.update)
			newVal = this.update(val, this.owner && this.owner.state);

		if (newVal===Skip)
			return;

		if (newVal instanceof Promise)
			newVal.then(this.set.bind(this), this.error.bind(this));
		else
			this.set(newVal===undefined ? val : newVal);
	}

	clone()
	{
		var result = new this.constructor(this.element, this.parameter, this.owner);

		result.once = this.once;

		return result;
	}

}

Object.assign(Directive.prototype, {
	value: Undefined,
	once: false
});

class EventListener {

	constructor(element, event, handler, options)
	{
		this.destroy = dom.on(element, event, handler, options);
	}

}

class Store
{
	constructor(State)
	{
		this.bindings = [];
		this.state = typeof(State)==='function' ? new State() : (State || {});
	}

	set(property, value)
	{
		if (value !== this.state[property])
		{
			this.state[property] = value;
			renderer.digest(this);
		}
	}

	observe(path)
	{
		const directive = new cxl.compiler.directives.state(this.host, path, this);
		this.bindings.push(directive);
		return directive;
	}

	digest()
	{
		renderer.digest(this);
	}

	destroy()
	{
		this.bindings.forEach(b => b.destroy());
	}
}

class View extends Store
{
	constructor(State, host)
	{
		super(State);
		this.host = host;

		this.connected = new rx.Subject();
	}

	setAttribute(name, newVal)
	{
		this.set(name, newVal==='' ? true : (newVal || false));
	}

	registerSlot(slot)
	{
		if (!slot.parameter)
		{
			this.defaultSlot = slot;
			return;
		}

		if (!this.slots)
			this.slots = [];

		this.slots.push(slot);
	}

	connect()
	{
		this.isConnected = true;
		this.connected.next(true);
		this.bindings.forEach(b => b.doConnect());
		cxl.renderer.commitDigest(this);
	}

	disconnect()
	{
		this.isConnected = false;
		this.connected.next(false);
		this.destroy();
	}
}

/**
 * Creates References and Bindings.
 */
class Compiler
{
	constructor()
	{
		this.directives = {};
		this.shortcuts = {
			'=': 'state',
			'#': 'call',
			'$': 'item',
			'@': 'getset'
		};
	}

	getDirective(parsed, element, owner)
	{
	var
		shortcut = parsed[2],
		name = parsed[3],
		param = parsed[4],
		directive = shortcut && this.shortcuts[shortcut],
		Ref, result
	;
		if (directive)
			param = name;
		else
			directive = name;

		Ref = this.directives[directive];

		if (!Ref)
			throw new Error('Directive "' + directive + '" not found.');

		result = new Ref(element, param, owner);

		return result;
	}

	createBinding(refA, refB, modifier, owner)
	{
	var
		twoway = modifier===':',
		once = modifier==='|',
		clone
	;
		if (once)
			refA.once = true;

		if (refA)
		{
			refA.subscribe(refB);

			if (twoway)
			{
				clone = refA.clone();
				refB.subscribe(clone);

				owner.bindings.push(refB);
			}

		} else if (refB)
			owner.bindings.push(refB);
	}

	parseBinding(element, bindingText, owner)
	{
		var parsed, refA, refB, index;

		bindRegex.lastIndex = 0;

		while ((parsed = bindRegex.exec(bindingText)))
		{
			index = bindRegex.lastIndex;
			refB = this.getDirective(parsed, element, owner);
			this.createBinding(refA, refB, parsed[1], owner);

			refA = parsed[5] && refB;

			bindRegex.lastIndex = index;
		}
	}

	compile(node, owner)
	{
		var binding = node.getAttribute && node.getAttribute('&');

		if (binding)
			this.parseBinding(node, binding, owner);

		if (node.firstChild)
			this.traverse(node.firstChild, owner);
	}

	traverse(node, owner)
	{
		var next = node.nextSibling;

		this.compile(node, owner);

		if (next)
			this.traverse(next, owner);
	}

}

const compiler = new Compiler();

class Template
{
	static fromId(id)
	{
		return new Template(document.getElementById(id).innerHTML);
	}

	static getFragmentFromString(content)
	{
		//if (content in TEMPLATES)
		//	return TEMPLATES[content];
		// We use <template> so components are not initialized
		const template = document.createElement('TEMPLATE');
		template.innerHTML = content;
		return template.content;
		//return (TEMPLATES[content] = template.content);
	}

	static getFragment(content)
	{
		if (typeof(content)==='string')
			return Template.getFragmentFromString(content);

		if (content instanceof window.Element)
		{
			if (content.tagName==='TEMPLATE' && content.content)
				return content.content;

			content = content.childNodes;
		}

		var result = document.createDocumentFragment();

		while (content.length)
			result.appendChild(content[0]);

		return result;
	}

	constructor(content)
	{
		this.$content = Template.getFragment(content);
		this.$content.normalize();
	}

	clone()
	{
		return document.importNode(this.$content, true);
	}

	compile(owner)
	{
		var nodes = this.clone();

		cxl.compiler.traverse(nodes.firstChild, owner);

		return nodes;
	}

}

class NodeSnapshot
{
	constructor(nodes)
	{
		this.nodes = [];

		for (var n of nodes)
			this.nodes.push(n);
	}

	appendTo(el)
	{
		this.nodes.forEach(n => el.appendChild(n));
	}

	remove()
	{
		this.nodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));
	}
}

class MutationEvent extends rx.Event { }

class AttributeObserver extends rx.Subject
{
	$onMutation(events)
	{
		events.forEach(ev => this.trigger(ev.attributeName));
	}

	$onEvent()
	{
		if (this.element.value !== this.$value)
		{
			this.$value = this.element.value;
			this.trigger('value');
		}

		if (this.element.checked !== this.$checked)
		{
			this.$checked = this.element.checked;
			this.trigger('checked');
		}
	}

	$initializeNative(element)
	{
		this.observer = new MutationObserver(this.$onMutation.bind(this));
		this.observer.observe(element, { attributes: true });

		this.bindings = [
			new EventListener(element, 'change', this.$onEvent.bind(this))
		];
	}

	constructor(element)
	{
		if (element.$$attributeObserver)
			return element.$$attributeObserver;

		super();

		this.element = element;
		element.$$attributeObserver = this;
	}

	onSubscribe()
	{
		// Use mutation observer for native dom elements
		if (!this.element.$view && !this.observer)
			this.$initializeNative(this.element);
	}

	unsubscribe(s)
	{
		super.unsubscribe(s);

		if (this.__subscribers.length===0)
			this.disconnect();
	}

	disconnect()
	{
		if (this.observer)
		{
			this.observer.disconnect();
			this.bindings.forEach(b => b.destroy());
		}
	}

	trigger(attributeName)
	{
		this.next(new MutationEvent('attribute', this.element, attributeName));
	}

	destroy()
	{
		super.destroy();
		this.disconnect();
	}
}

class Marker {

	constructor(text, element)
	{
		const parent = element.parentNode;

		this.node = document.createComment(text);
		parent.insertBefore(this.node, element);
		parent.removeChild(element);
	}

	insert(content, nextNode)
	{
		this.node.parentNode.insertBefore(content, nextNode || this.node);
	}

	empty()
	{
		cxl.dom.empty(this.node.parentNode);
	}
}

class ChildrenObserver extends rx.Subject
{
	$event(type, el)
	{
		return new MutationEvent(type, this.element, el);
	}

	$trigger(type, nodes)
	{
		for (let el of nodes)
			this.next(this.$event(type, el));
	}

	$handleEvent(ev)
	{
		this.$trigger('added', ev.addedNodes);
		this.$trigger('removed', ev.removedNodes);
	}

	$onEvents(events)
	{
		events.forEach(this.$handleEvent, this);
	}

	constructor(element)
	{
		if (element.$$childrenObserver)
			return element.$$childrenObserver;

		super();
		this.element = element;
		element.$$childrenObserver = this;
	}

	onSubscribe()
	{
		if (!this.observer)
		{
			this.observer = new MutationObserver(this.$onEvents.bind(this));
			this.observer.observe(this.element, { childList: true });
		}
	}

	unsubscribe(s)
	{
		super.unsubscribe(s);

		if (this.__subscribers.length===0)
			this.observer.disconnect();
	}

	destroy()
	{
		super.destroy();
		this.observer.disconnect();
	}
}

function directive(name, Fn, shortcut)
{
	if (typeof(Fn)!=='function')
		Fn = cxl.extendClass(Directive, Fn, name);

	if (shortcut)
		compiler.shortcuts[shortcut] = name;

	return (compiler.directives[name] = Fn);
}

directive('value', {

	initialize()
	{
		// Prevent value from digesting
		this.value = this.element.value;
	},

	connect()
	{
		var owner = this.owner;

		function onChange() {
			renderer.digest(owner);
		}

		this.bindings = [
			new EventListener(this.element, 'change', onChange),
			new EventListener(this.element, 'input', onChange)
		];
	},

	update(val)
	{
		if (this.element.value!==val)
			this.element.value = val;
	},

	digest()
	{
		return this.element.value;
	}

});

directive('owner', {
	digest() { return this.owner; }
});

directive('ref.get', {

	initialize()
	{
		this.bindings = [ this.owner.observe(this.parameter).subscribe(this) ];
	},

	update(ref)
	{
		if (this.subscription)
			this.subscription.unsubscribe();

		if (ref)
			this.bindings[1] = this.subscription = ref.subscribe(this.set.bind(this));

		return Skip;
	}

});

directive('ref.set', {

	initialize()
	{
		this.getter = cxl.getter(this.parameter);
	},

	update(val, state)
	{
		const ref = this.getter(state);
		// TODO reference should always be set?
		if (ref && this.value !== val)
			ref.set(val);
	}
});

directive('ref.val', {

	initialize()
	{
		this.getter = cxl.getter(this.parameter);
		this.bindings = [
			this.owner.observe(this.parameter).subscribe({
				next: this.setup.bind(this),
				destroy() { }
			})
		];
	},

	setup(ref)
	{
		if (this.subscription)
			this.subscription.unsubscribe();

		this.reference = ref;

		if (ref)
			this.bindings[1] = this.subscription = ref.subscribe(this.onValue.bind(this));
	},

	onValue(val)
	{
		this.set(val);
	},

	update(val, state)
	{
		const ref = this.getter(state);
		// TODO reference should always be set?
		if (ref && this.value !== val)
			ref.set(val);
	}

}, '&');

directive('state', {

	update(val, state) {
		this.update = cxl.setter(this.parameter);
		return this.update(val, state);
	},

	digest(state) {
		if (this.parameter)
		{
			this.digest = cxl.getter(this.parameter);
			return this.digest(state);
		}

		return state;
	}

});

directive('style', {
	update(val) {
		this.element.classList.toggle(this.parameter || val, val||false);
	},
	digest() {
		this.update(true);
		this.digest = null;
	}
}, '.');

directive('getset', {

	update(val)
	{
		this.element[this.parameter] = val;
	},

	$digest()
	{
		return this.element[this.parameter];
	},

	onMutation(ev)
	{
		if (ev.type==='attribute' && ev.value===this.parameter)
			this.owner.digest();
	},

	digest()
	{
		var observer = this.observer = new AttributeObserver(this.element);

		this.bindings = [ observer.subscribe(this.onMutation.bind(this)) ];

		this.digest = this.$digest;

		return this.element[this.parameter];
	}

});

directive('item', {

	initialize()
	{
		this.item = this.owner.state.$item;
	},

	update(val)
	{
		if (this.parameter)
			this.item[this.parameter] = val;
		else
			this.owner.state.$item = val;
	},

	digest()
	{
		return this.parameter ? this.item[this.parameter] : this.item;
	}

});

directive('item.each', {

	each(value, key)
	{
		const item = new rx.Item(value, key);
		item.index = this.index++;
		this.subscriber.next(item);
	},

	set(val)
	{
		this.value = val;
		this.index = 0;

		if (this.subscriber)
			cxl.each(val, this.each, this);

		if (this.once)
			this.destroy();
	}

});

directive('each', {

	each(item)
	{
		this.subscriber.next(item);
	},

	set(val)
	{
		this.value = val;

		if (this.subscriber)
			cxl.each(val, this.each, this);

		if (this.once)
			this.destroy();
	}

});

class ElementList
{
	constructor(element, owner)
	{
		this.items = new Map();
		this.template = new Template(element);
		this.marker = new Marker('list', element);
		this.owner = owner;
	}

	add(item, next)
	{
		this.owner.state.$item = item;
	const
		nextNode = next && this.items[next],
		fragment = this.template.compile(this.owner)
	;
		this.items.set(item, new NodeSnapshot(fragment.childNodes));
		cxl.renderer.commitDigest(this.owner);
		this.marker.insert(fragment, nextNode && nextNode.nodes[0]);
	}

	remove(item)
	{
		this.items[item].remove();
		this.items.delete(item);
	}

	empty()
	{
		if (this.items.size)
		{
			this.items.forEach(item => item.remove());
			this.items.clear();
		}
	}

	destroy()
	{
		this.items.clear();
	}
}

directive('list', {

	initialize()
	{
		this.bindings = [ this.list = new ElementList(this.element, this.owner) ];
	},

	update(event)
	{
		if (event.type==='added')
			this.list.add(event.value, event.nextValue);
		else if (event.type==='removed')
			this.list.remove(event.value);
		else if (event.type==='empty')
			this.list.empty();
	}

});

directive('list.count', {
	value: 0,
	update(event)
	{
		if (event.type==='added')
			this.value++;
		else if (event.type==='removed')
			this.value--;
		else if (event.type==='empty')
			this.value = 0;

		return this.value;
	}
});

directive('id', {

	initialize()
	{
		if (this.parameter)
			this.update(this.parameter, this.owner.state);
	},

	update(val, state)
	{
		state[val] = this.element;
	}

});

directive('drag.x', {

	connect()
	{
		this.bindings = [
			new EventListener(this.element, 'mousedown', this.onMouseDown.bind(this)),
			new EventListener(window, 'mousemove', this.onMouseMove.bind(this)),
			new EventListener(window, 'mouseup', this.onMouseUp.bind(this)),
			new EventListener(this.element, 'touchstart', this.onTouchDown.bind(this)),
			new EventListener(window, 'touchmove', this.onTouchMove.bind(this)),
			new EventListener(window, 'touchend', this.onMouseUp.bind(this))
		];
	},

	onMouseUp(ev)
	{
		if (this.capture)
		{
			var x = (ev.changedTouches ? ev.changedTouches[0] : ev).clientX;
			this.set((x-this.offset) / this.capture.clientWidth);
		}
		this.capture=false;
	},

	onMouseDown(ev)
	{
		var el=this.capture=ev.currentTarget;
		this.offset = el.getBoundingClientRect().left;
	},

	onTouchDown(ev)
	{
		var el = this.capture=ev.currentTarget;
		this.offset=el.offsetLeft;
	},

	onTouchMove(ev)
	{
		if (this.capture)
		{
			const el = this.capture;
			this.set((ev.touches[0].clientX-this.offset) / el.clientWidth);
		}
	},

	onMouseMove(ev)
	{
		if (this.capture)
		{
			const el = this.capture;
			this.set((ev.clientX-this.offset) / el.clientWidth);
		}
	}

});

directive('content', {

	initialize()
	{
	var
		component = this.owner.host,
		slot = this.slot = this.element.tagName === 'SLOT' ?
			this.element : document.createElement('SLOT')
	;
		if (this.parameter)
		{
			this.observer = new ChildrenObserver(component);
			slot.name = this.parameter;
		}

		this.owner.registerSlot(this);

		if (this.element !== slot)
			this.element.appendChild(slot);
	},

	connect()
	{
		if (this.parameter)
		{
			this.bindings = [ this.observer.subscribe(this.onMutation.bind(this)) ];

			// Initialize children slots
			for (var node of this.owner.host.childNodes)
				this.assignSlot(node);
		}
	},

	assignSlot(node)
	{
		var sel = this.parameter;

		if (node.matches && node.matches(sel))
			node.slot = sel;
	},

	onMutation(ev)
	{
		if (ev.type==='added')
			this.assignSlot(ev.value);
	}

});

directive('action', {

	event: Undefined,

	onEvent(ev)
	{
		ev.stopPropagation();
		ev.stopImmediatePropagation();
		this.set(ev);
	},

	onKeyPress(ev)
	{
		if (ev.key==='Enter' || ev.key===' ')
			this.onEvent(ev);
	},

	onAction(ev)
	{
		if (ev.target !== this.owner.host)
			this.onEvent(ev);
	},

	connect()
	{
		this.bindings = [
			new EventListener(this.element, 'click', this.onEvent.bind(this)),
			new EventListener(this.element, 'keypress', this.onKeyPress.bind(this)),
			new EventListener(this.element, 'action', this.onAction.bind(this))
		];
	}

});

class Anchor
{
	$create(name, el)
	{
		this.name = name;
		this.element = el;
		ANCHORS[name] = this;
	}

	constructor(name, el)
	{
		this.$create(name, el);
	}

	focus()
	{
		this.element.scrollIntoView();
		this.element.focus();
	}

	insert(element)
	{
		this.element.appendChild(element);
	}

	destroy()
	{
		delete ANCHORS[this.name];
	}
}

/**
 * Anchors are used to interact with elements outside the component.
 * TODO See if we need this...
 */
directive('anchor', {
	connect() { if (this.parameter) this.update(this.parameter); },
	disconnect() { if (this.anchor) this.anchor.destroy(); },
	update(val) {
		if (this.anchor)
			this.anchor.destroy();

		if (val)
		{
			this.parameter = val;
			this.anchor = new Anchor(val, this.element);
		}
	}
});

/*directive('anchor.marker', {
	connect() {
		this.marker = new Marker('anchor', this.element);
		if (this.parameter) this.update(this.parameter); },
	disconnect() { delete ANCHORS[this.name]; },
	insert(el) { this.marker.insert(el); },
	update(val) {
		if (this.name)
			delete ANCHORS[this.name];

		this.name = val;
		ANCHORS[val] = this;
	}
});*/

function dom(el, attributes) {
	var result = dom.createElement(el);

	if (attributes)
		for (var i in attributes)
			result[i] = attributes[i];

	return result;
}

function $$find(child, selector, first, next)
{
	var result;

	while (child)
	{
		if (selector(child))
			return child;

		if (child[first])
		{
			if ((result = $$find(child[first], selector)))
				return result;
		}

		child = child[next];
	}

	return null;
}

function $$findSelector(selector)
{
	if (typeof(selector)==='string')
		return item => item.matches && item.matches(selector);

	return selector;
}

Object.assign(dom, {

	createElement(name)
	{
		return document.createElement(name);
	},

	empty(el)
	{
		var c;
		while ((c = el.childNodes[0]))
			el.removeChild(c);
	},

	find(el, selector)
	{
		return $$find(el.firstChild, $$findSelector(selector), 'firstChild', 'nextSibling');
	},

	findNext(child, selector)
	{
		return $$find(child.nextSibling, $$findSelector(selector), 'firstChild', 'nextSibling');
	},

	findPrevious(child, selector)
	{
		return $$find(child.previousSibling, $$findSelector(selector), 'lastChild', 'previousSibling');
	},

	query(el, selector, result)
	{
		var child=el.firstChild;
		result = result || [];

		while (child)
		{
			if (child.matches && child.matches(selector))
				result.push(child);

			if (child.firstChild)
				dom.query(child, selector, result);

			child = child.nextSibling;
		}

		return result;
	},

	setContent(el, content)
	{
		dom.empty(el);
		dom.insert(el, content);
	},

	on(element, event, handler, options)
	{
		element.addEventListener(event, handler, options);
		return element.removeEventListener.bind(element, event, handler, options);
	},

	setAttribute(el, attr, val)
	{
		if (val===false || val===null || val===undefined)
			val = null;
		else if (val===true)
			val = "";
		else
			val = val.toString();

		if (val===null)
			el.removeAttribute(attr);
		else
			el.setAttribute(attr, val);

		return val;
	},

	insert(el, content)
	{
		if (content===undefined || content===null)
			return;

		if (!(content instanceof window.Node))
			content = document.createTextNode(content);

		el.appendChild(content);
	},

	removeChild(el, child)
	{
		el.removeChild(child);
	},

	remove(child)
	{
		if (Array.isArray(child))
			return child.forEach(c => dom.removeChild(child.parentNode, c));

		return dom.removeChild(child.parentNode, child);
	},

	trigger(el, event, detail)
	{
		var ev = new window.Event(event, { bubbles: true });
		ev.detail = detail;
		el.dispatchEvent(ev);
	}

});

directive('call', {
	update(val, state) { return state[this.parameter].call(state, val, this.element); },
	digest(state) { return state[this.parameter].call(state, this.value, this.element); }
});

function EventObservable(el, event)
{
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

	Anchor: Anchor,
	AttributeObserver: AttributeObserver,
	ChildrenObserver: ChildrenObserver,
	Compiler: Compiler,
	Directive: Directive,
	ElementList: ElementList,
	Event: Event,
	EventObservable: EventObservable,
	EventListener: EventListener,
	HTMLElement: window.HTMLElement,
	Marker: Marker,
	NodeSnapshot: NodeSnapshot,
	Template: Template,
	View: View,

	anchor(name)
	{
		return ANCHORS[name];
	},

	behavior: behavior,
	compiler: compiler,
	directive: directive,
	dom: dom,

	replaceParameters(path, params)
	{
		if (params===null || params===undefined)
			return path;

		if (typeof(params)!=='object')
			params = { $: params };

		return path.replace(PARAM_REGEX, function(match, key) {
			return params[key];
		});
	},

	each(coll, fn, scope)
	{
		if (Array.isArray(coll))
			return coll.forEach(fn, scope);

		for (const i in coll)
			if (coll.hasOwnProperty(i))
				fn.call(scope, coll[i], i);
	},

	event: {

		halt(ev)
		{
			ev.preventDefault();
			ev.stopPropagation();
			ev.stopImmediatePropagation();
		}

	},

	/** Returns a getter function with a state parameter */
	getter(expr)
	{
		/*jshint evil:true*/
		return GETTERS[expr] || (GETTERS[expr] = expr.indexOf('.')===-1 ?
			function(state) { return state[expr]; } :
			new Function('state', `try{return(state.${expr});}catch(e){return null;}`)
		);
	},

	/** Returns a setter function with value and state parameters */
	setter(expr)
	{
		/*jshint evil:true*/
		return SETTERS[expr] || (SETTERS[expr] = expr.indexOf('.')===-1 ?
			function(val, state) { state[expr]=val; } :
			new Function('val', 'state', `state.${expr}=val;`)
		);
	},

	renderer: renderer

});

function source(name, subscribe)
{
	directive(name, {
		initialize(el, param, view) {
			view.connected.subscribe(val => {
				if (val)
				{
					// TODO last parameter should be subscriber, using "this" so
					// "once" logic works properly
					var teardown = subscribe(el, param, view, this);

					if (typeof(teardown)==='function')
						teardown = { unsubscribe: teardown };

					this.bindings = [ teardown ];
				}
			});
		}
	});
}

function sources(defs)
{
	for (var i in defs)
		source(i, defs[i]);
}

directive('connect', { connect() { this.set(true); } });
directive('disconnect', { disconnect() { this.set(true); }});

sources({});

function connectedSources(defs)
{
	for (var i in defs)
		source(i, defs[i]);
}

directive('on.message', {
	initialize(el, param) {
		new EventListener(el, param, this.set.bind(this));
	}
});

connectedSources({

	'anchor.send'(el, param)
	{
		cxl.anchor(param).insert(el);
		return cxl.dom.remove.bind(null, el);
	},

	/**
	 * Binds to DOM element event.
	 */
	on(el, param, view, subscriber)
	{
		return new EventListener(el, param, subscriber.next.bind(subscriber));
	},

	keypress(el, param, view, subscriber)
	{
		if (param==='space')
			param=' ';

		return new EventListener(el, 'keydown', ev => {
			if (!param || ev.key.toLowerCase()===param)
				subscriber.next(ev);
		});
	},

	'host.mutation'(el, param, view, subs)
	{
		const observer = new ChildrenObserver(view.host);
		return observer.subscribe(subs.next.bind(subs));
	},

	location(el, param, view, subs)
	{
		subs.next(window.location.hash);

		return new EventListener(window, 'hashchange', () => {
			subs.next(window.location.hash);
		});
	},

	'root.on'(el, param, view, subs)
	{
		return new EventListener(window, param, subs.next.bind(subs));
	},

	timer(el, param, view, subs)
	{
	var
		value = 1,
		delay = param ? view.state[param] : 1000,
		interval = setInterval(() => subs.next(value++), delay)
	;
		return clearInterval.bind(window, interval);
	}

});

function operator(name, fn)
{
	directive(name, function(el, param, view) {
		const d = new Directive();
		d.update = fn(el, param, view);
		return d;
	});
}

function operators(defs)
{
	for (var i in defs)
		operator(i, defs[i]);
}

operators({

	repeat(el, param, view)
	{
	const
		tpl = new Template(el),
		marker = new Marker('repeat', el)
	;
		return item => {
			view.state.$item = item;
			const html = tpl.compile(view);
			//cxl.renderer.commitDigest(view);
			marker.insert(html);
		};
	}

});

function pipes(defs) {
	for (var i in defs)
		directive(i, { update: defs[i] });
}

/**
 * Pipes are update only directives
 */
pipes({

	attribute(val) { return cxl.dom.setAttribute(this.element, this.parameter, val); },

	bool(val) { return val!==undefined && val!==null && val!==false; },

	'event.prevent'(ev) { ev.preventDefault(); },

	'event.stop'(ev) { ev.stopPropagation(); },

	'event.halt': cxl.event.halt,

	filter(val) { return val || cxl.Skip; },

	focus(val) { if (val) this.element.focus(); },

	gate(val) { return this.owner.state[this.parameter] ? val : Skip; },

	'focus.gate'(ev, state)
	{
		if (!state[this.parameter])
		{
			cxl.event.halt(ev);
			return Skip;
		}
	},

	'focus.enable'(value) {
		if (value)
			this.element.tabIndex = 0;
		else
			this.element.removeAttribute('tabindex');
	},

	hide(value) { this.element.style.display = value ? 'none' : ''; },

	'host.trigger'(detail) { dom.trigger(this.owner.host, this.parameter, detail); },

	insert(value) { dom.insert(this.element, value); },

	'list.loading'(event) {
		const newVal = event.type==='empty';
		// TODO ?
		return newVal===this.value ? cxl.Skip : newVal;
	},

	observe(observable)
	{
		if (this.bindings)
			this.bindings[0].unsubscribe();

		if (observable)
			this.bindings = [ observable.subscribe(this.set.bind(this)) ];

		return cxl.Skip;
	},

	not(value) { return !value; },

	prop(obj) { const res=obj && obj[this.parameter]; return res===undefined ? null : res; },

	replace(val, state)
	{
		return cxl.replaceParameters(state[this.parameter], val);
	},

	show(value) { this.element.style.display = value ? '' : 'none'; },

	sort(value) { return value && value.sort(); },

	'style.inline'(val) { this.element.style[this.parameter] = val; },

	text(value) { dom.setContent(this.element, value); },

	toggle(val, state) { return (state[this.parameter] = !state[this.parameter]); }

});

cxl.anchor.anchors = ANCHORS;

/**
 * Behaviors are directives with independent state
 */
function behavior(name, def)
{
	if (typeof(def)==='string')
		def = { bindings: def };

	directive(name, {

		initialize(el)
		{
		const
			state = Object.assign({}, def),
			view = this.view = new View(state, el)
		;
			// TODO keep this here?
			state.$behavior = this;
			compiler.parseBinding(el, state.bindings, view);
			this.bindings = view.bindings;
		},

		connect() { this.view.connect(); },
		disconnect() { this.view.disconnect(); }
	});
}

})(this.cxl);