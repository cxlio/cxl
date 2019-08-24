(cxl => {
	'use strict';

	const EMPTY_NODE_REGEX = /\S/;

	function $$find(child, selector, first, next) {
		let result;

		while (child) {
			if (selector(child)) return child;

			if (child[first]) {
				if ((result = $$find(child[first], selector))) return result;
			}

			child = child[next];
		}

		return null;
	}

	function $$findSelector(selector) {
		if (typeof selector === 'string')
			return item => item.matches && item.matches(selector);

		return selector;
	}

	function dom(tagName, attr) {
		const el = dom.createElement(tagName);

		for (const i in attr) el[i] = attr[i];

		return el;
	}

	cxl.dom = Object.assign(dom, {
		createElement(tagName) {
			return document.createElement(tagName);
		},

		empty(el) {
			let c;
			while ((c = el.childNodes[0])) el.removeChild(c);
		},

		event: {
			stop(ev) {
				ev.stopPropagation();
				ev.stopImmediatePropagation();
			},
			halt(ev) {
				ev.preventDefault();
				dom.event.stop();
			}
		},

		find(el, selector) {
			return $$find(
				el.firstChild,
				$$findSelector(selector),
				'firstChild',
				'nextSibling'
			);
		},

		findNext(child, selector) {
			return $$find(
				child.nextSibling,
				$$findSelector(selector),
				'firstChild',
				'nextSibling'
			);
		},

		findPrevious(child, selector) {
			return $$find(
				child.previousSibling,
				$$findSelector(selector),
				'lastChild',
				'previousSibling'
			);
		},

		/**
		 * Remove empty nodes
		 * TODO Improve performance, or move it to build time.
		 */
		normalize(node) {
			let child = node.firstChild;

			while (child) {
				const nodeType = child.nodeType;

				if (nodeType === Node.COMMENT_NODE) node.removeChild(child);
				else if (
					nodeType === Node.TEXT_NODE &&
					!EMPTY_NODE_REGEX.test(child.nodeValue)
				)
					node.removeChild(child);
				else if (
					nodeType === Node.ELEMENT_NODE &&
					child.childNodes.length
				)
					dom.normalize(child);

				child = child.nextSibling;
			}

			return node;
		},

		query(el, selector, result) {
			var child = el.firstChild;
			result = result || [];

			while (child) {
				if (child.matches && child.matches(selector))
					result.push(child);

				if (child.firstChild) dom.query(child, selector, result);

				child = child.nextSibling;
			}

			return result;
		},

		setContent(el, content) {
			dom.empty(el);
			dom.insert(el, content);
		},

		on(element, event, handler, options) {
			element.addEventListener(event, handler, options);
			return element.removeEventListener.bind(
				element,
				event,
				handler,
				options
			);
		},

		setAttribute(el, attr, val) {
			if (val === false || val === null || val === undefined) val = null;
			else if (val === true) val = '';
			else val = val.toString();

			if (val === null) el.removeAttribute(attr);
			else el.setAttribute(attr, val);

			return val;
		},

		insert(el, content) {
			if (content === undefined || content === null) return;

			if (!(content instanceof window.Node))
				content = document.createTextNode(content);

			el.appendChild(content);
		},

		isEmpty(el) {
			return el.childNodes.length === 0;
		},

		removeChild(el, child) {
			el.removeChild(child);
		},

		remove(child) {
			if (Array.isArray(child))
				return child.forEach(c => dom.removeChild(child.parentNode, c));

			if (child.parentNode) dom.removeChild(child.parentNode, child);
		},

		setStyle(el, className, enable) {
			el.classList[enable || enable === undefined ? 'add' : 'remove'](
				className
			);
		},

		trigger(el, event, detail) {
			var ev = new window.Event(event, { bubbles: true });
			ev.detail = detail;
			el.dispatchEvent(ev);
		}
	});
})(this.cxl);
