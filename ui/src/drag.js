(cxl => {
"use strict";
const
	rx = cxl.rx,
	EventListener = cxl.EventListener,
	directive = cxl.directive,
	behavior = cxl.behavior,
	component = cxl.component,
	dragManager = {
		dragging: new Set(),
		subject: new rx.Subject(),

		get isDragging()
		{
			return this.dragging.size > 0;
		},

		drag(directive, ev)
		{
			this.subject.next({
				type: 'drag', target: directive.element, directive: directive,
				x: directive.x, y: directive.y, clientX: ev.clientX, clientY: ev.clientY
			});
		},

		dragStart(directive)
		{
			const element = directive.element;

			if (!this.dragging.has(element))
			{
				this.dragging.add(element);
				this.subject.next({ type: 'start', target: element, directive: directive });
			}
		},

		dragEnd(directive)
		{
			const element = directive.element;

			if (this.dragging.has(element))
			{
				this.subject.next({ type: 'end', target: element, directive: directive });
				this.dragging.delete(element);
			}
		}
	}
;

class DragBase extends cxl.Directive
{
	connect()
	{
		this.element.style.userSelect = 'none';
		this.bindings = [
			new EventListener(this.element, 'mousedown', this.onMouseDown.bind(this)),
			new EventListener(window, 'mousemove', this.onMove.bind(this)),
			new EventListener(window, 'mouseup', this.onMouseUp.bind(this)),
			new EventListener(this.element, 'touchstart', this.onMouseDown.bind(this)),
			new EventListener(window, 'touchmove', this.onMove.bind(this)),
			new EventListener(window, 'touchend', this.onMouseUp.bind(this))
		];
	}

	$getEvent(ev)
	{
		if (ev.touches)
		{
			for (let touch of ev.changedTouches)
				if (touch.identifier===this.touchId)
					return touch;
		} else
			return ev;
	}

	$getTouchId(ev)
	{
		for (let touch of ev.changedTouches)
			if (touch.target === ev.target)
				return touch.identifier;
	}

	onMouseUp(ev)
	{
		if (this.capture)
		{
			const touch = this.$getEvent(ev);

			if (touch)
			{
				this.onEnd(touch);
				this.touchId = null;
				this.capture = false;
			}
		}
	}

	onMouseDown(ev)
	{
		if (ev.touches)
		{
			this.touchId = this.$getTouchId(ev);
			ev.preventDefault();
		}

		this.capture = ev.currentTarget;
		this.onStart(this.$getEvent(ev));
	}

	onMove(ev)
	{
		if (this.capture)
		{
			const touch = this.$getEvent(ev);

			if (touch)
				this.onDrag(touch);
		}
	}

}

class DragEvents extends DragBase {

	$event(type)
	{
		this.set({ type: type, target: this.element, x: this.x, y: this.y });
	}

	onDrag()
	{
		this.$event('drag');
	}

	onStart()
	{
		this.$event('start');
	}

	onEnd()
	{
		this.$event('end');
	}

}

class DragMove extends DragBase {

	onEnd()
	{
		this.reset();
		dragManager.dragEnd(this);
	}

	reset()
	{
		this.element.style.transform = ``;
	}

	initializeDimensions(el, ev)
	{
		this.width = el.offsetWidth;
		this.height = el.offsetHeight;
		this.offsetY = ev.clientY;
		this.offsetX = ev.clientX;
	}

	onStart(ev)
	{
		const el = this.element;
		this.initializeDimensions(el, ev);
		dragManager.dragStart(this);
	}

	calculateDrag(ev)
	{
		this.x = (ev.clientX-this.offsetX) / this.width;
		this.y = (ev.clientY-this.offsetY) / this.height;
	}

	performDrag(ev, p)
	{
		var transform;

		if (p==='x')
			transform = `translateX(${this.x})`;
		else if (p==='y')
			transform = `translateY(${this.y})`;
		else
			transform = `translate(${this.x*100}%, ${this.y*100}%)`;

		this.element.style.transform = transform;
	}

	onDrag(ev)
	{
		this.calculateDrag(ev);
		this.performDrag(ev, this.parameter);
		dragManager.drag(this, ev);
	}

}

class DragMoveIn extends DragMove {

	initializeDimensions(el)
	{
		const rect = el.getBoundingClientRect();

		this.width = el.offsetWidth;
		this.height = el.offsetHeight;
		this.offsetY = rect.top;
		this.offsetX = rect.left;
	}

	reset()
	{
	}

	performDrag(ev, p)
	{
		this.x = (ev.clientX-this.offsetX) / this.width;
		this.y = (ev.clientY-this.offsetY) / this.height;

		if (p==='x')
			this.set(this.x);
		else if (p==='y')
			this.set(this.y);
		else
			this.set(this);
	}

}

directive('drag.in', DragMoveIn);

directive('drag.region', {

	elementsIn: null,

	connect()
	{
		this.elementsIn = new Set();
		this.bindings = [
			dragManager.subject.subscribe(this.onDragEvent.bind(this))
		];
	},

	$event(type, element)
	{
		this.set({
			type: type, target: this.element, elementsIn: this.elementsIn,
			droppedElement: element
		});
	},

	onDragEvent(ev)
	{
		if (ev.type==='start')
			this.rect = this.element.getBoundingClientRect();
		else if (ev.type==='end')
		{
			if (this.isElementIn(ev))
				this.$event('drop', ev.target);

			this.onLeave(ev.target);

		} else if (ev.type==='drag')
			this.onMove(ev);
	},

	isElementIn(ev)
	{
	const
		x = ev.clientX,
		y = ev.clientY,
		rect = this.rect
	;
		return (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom);
	},

	onEnter(el)
	{
		const els = this.elementsIn, size = els.size;

		if (!els.has(el))
		{
			els.add(el);
			this.$event('in');
		}

		if (size===0)
			this.$event('enter');
	},

	onLeave(el)
	{
		const els = this.elementsIn;

		if (els.has(el))
		{
			els.delete(el);
			this.$event('out');

			if (els.size===0)
				this.$event('leave');
		}
	},

	onMove(ev)
	{
		if (!this.rect)
			return;
		const target = ev.target;

		if (this.isElementIn(ev))
			this.onEnter(target);
		else if (this.elementsIn.size)
			this.onLeave(target);
	}

});

behavior('draggable.region', {

	bindings: `drag.region:#onEvent`,
	onEvent(ev, el)
	{
		cxl.dom.trigger(el, 'draggable.' + ev.type);

		if (ev.type==='drop')
			this.$behavior.next(ev);
	}

});

directive('drag.events', DragEvents);
directive('draggable', DragMove);

component({
	name: 'cxl-drag-region',
	events: [ 'draggable.in', 'draggable.out', 'draggable.leave', 'draggable.enter', 'draggable.drop' ],
	attributes: [ 'over', 'in-count' ],
	bindings: 'drag.region:#onEvent'
}, {
	'in-count': 0,

	onEvent(ev, host)
	{
		switch (ev.type) {
		case 'drop': this.onDrop(ev, host); break;
		case 'enter': case 'leave': this.over = ev.type==='enter'; break;
		}

		this['in-count'] = ev.elementsIn.size;
		cxl.dom.trigger(host, 'draggable.' + ev.type);
	},
	onDrop()
	{
	}
});

component({
	name: 'cxl-drag-slot',
	extend: 'cxl-drag-region',
	attributes: ['swap']
}, {
	onDrop(ev, host)
	{
		const el = ev.droppedElement, parent = el.parentElement;

		if (cxl.dom.isEmpty(host))
			host.appendChild(el);
		else if (this.swap && parent.swap)
		{
			parent.appendChild(host.childNodes[0]);
			host.appendChild(el);
		}
	}
});

component({
	name: 'cxl-drag',
	events: [ 'draggable.start', 'draggable.end' ],
	bindings: 'draggable'
});

})(this.cxl);