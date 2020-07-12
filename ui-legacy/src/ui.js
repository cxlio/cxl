(cxl => {
	'use strict';

	const Undefined = cxl.Undefined,
		component = cxl.component,
		behavior = cxl.behavior,
		directive = cxl.directive,
		ui = (cxl.ui = {
			icons: {},
		}),
		FocusCSS = {
			$active: { state: 'active' },
			$hover: { state: 'hover' },
			$focus: { state: 'focus' },
		},
		FocusCircleCSS = {
			$focus: { outline: 0 },
			focusCircle: {
				position: 'absolute',
				width: 48,
				height: 48,
				backgroundColor: '#ccc',
				borderRadius: 24,
				opacity: 0,
				scaleX: 0,
				scaleY: 0,
				display: 'inline-block',
				translateX: -14,
				translateY: -14,
			},
			focusCirclePrimary: { backgroundColor: 'primary' },
			focusCircle$invalid$touched: { backgroundColor: 'error' },
			focusCircle$hover: {
				scaleX: 1,
				scaleY: 1,
				translateX: -14,
				translateY: -14,
				opacity: 0.14,
			},
			focusCircle$focus: {
				scaleX: 1,
				scaleY: 1,
				translateX: -14,
				translateY: -14,
				opacity: 0.25,
			},
			focusCircle$disabled: { scaleX: 0, scaleY: 0 },
		},
		DisabledCSS = {
			$disabled: {
				state: 'disabled',
			},
			$active$disabled: { state: 'disabled' },
			$hover$disabled: { state: 'disabled' },
		};
	function prefix(prefix, css) {
		const result = {};

		for (const i in css) result[prefix + i] = css[i];

		return result;
	}

	behavior('ripple', {
		bindings:
			'@disabled:=disabled on(mousedown):=event keypress:#onKey =event:#ripple',

		ripple(ev, el) {
			if (!this.disabled && ev) {
				ui.ripple(el, ev);
				this.$behavior.next(ev);
			}
		},

		onKey(ev) {
			if (ev.key === 'Enter' || ev.key === ' ') {
				this.event = ev;
				ev.preventDefault();
			}
		},
	});

	behavior('navigation.grid', {
		bindings: 'keypress:#onKey:event.prevent',
		onKey(ev, el) {
			const focused = el.querySelector(':focus'),
				children = new cxl.ElementChildren(el);
			if (!focused) return;

			let cols = el.columns,
				next = focused;

			switch (ev.key) {
				case 'ArrowUp':
					while (cols--) next = children.previousTo(next);
					break;
				case 'ArrowDown':
					while (cols--) next = children.nextTo(next);
					break;
				case 'ArrowLeft':
					next = children.previousTo(next);
					break;
				case 'ArrowRight':
					next = children.nextTo(next);
					break;
				default:
					return cxl.Skip;
			}

			if (next) this.$behavior.next(next);
		},
	});

	behavior('navigation.select', {
		bindings: 'keypress:#onKey:event.prevent',
		onKey(ev, host) {
			let el = this.$behavior.value,
				key = ev.key;
			const children = new cxl.ElementChildren(host);

			function findByFirst(item) {
				return (
					item.innerText &&
					item.innerText.charAt(0).toLowerCase() === key
				);
			}

			switch (key) {
				case 'ArrowDown':
					el = el ? children.nextTo(el) || el : children.first;
					break;
				case 'ArrowUp':
					el = el ? children.previousTo(el) || el : children.last;
					break;
				default:
					key = key.toLowerCase();

					// TODO ?
					if (/^[a-z]$/.test(key))
						el =
							(el && cxl.dom.findNext(el, findByFirst)) ||
							cxl.dom.find(host, findByFirst) ||
							this.selected;
					else return cxl.Skip;
			}

			this.$behavior.next(el);
		},
	});

	behavior('navigation.list', {
		bindings: 'keypress:#onKey:event.prevent',

		onKey(ev, host) {
			const children = new cxl.ElementChildren(host),
				key = ev.key;
			const el =
				this.$behavior.value !== cxl.Undefined && this.$behavior.value;
			let newEl = el;

			switch (key) {
				case 'ArrowDown':
					newEl = (newEl && children.nextTo(newEl)) || children.first;

					while (newEl && (newEl.disabled || !newEl.clientHeight)) {
						newEl = newEl && children.nextTo(newEl);
					}

					newEl = newEl || el;

					break;
				case 'ArrowUp':
					newEl =
						(newEl && children.previousTo(newEl)) || children.last;

					while (newEl && (newEl.disabled || !newEl.clientHeight)) {
						newEl = newEl && children.previousTo(newEl);
					}

					newEl = newEl || el;
					break;
				default:
					return cxl.Skip;
			}

			if (newEl) this.$behavior.set(newEl);
		},
	});

	behavior(
		'touchable',
		`
	on(blur):bool:@touched
	@touched:host.trigger(focusable.touched)
`
	);
	behavior(
		'focusable',
		`
		@disabled:aria.prop(disabled):not:focus.enable
		focusable.events`
	);

	behavior('focusable.events', {
		bindings: `
	on(focus):#update:host.trigger(focusable.focus)
	on(blur):#update:host.trigger(focusable.blur)
		`,
		update(ev) {
			const host = this.$behavior.owner.host;

			host.focused = !host.disabled && ev.type === 'focus';
		},
	});

	behavior(
		'selectable',
		`
	registable(selectable)
	action:host.trigger(selectable.action)
	@selected:aria.prop(selected)
`
	);
	behavior('selectable.host', {
		bindings: `
id(host)
registable.host(selectable):=options
=event:#onChange
=options:#onChange
on(change):#onChangeEvent
on(selectable.action):#onAction
@value:=value:#onChange
=selected:#onSelected
	`,

		selected: null,

		/**
		 * Event to handle change event for cxl-option.
		 * TODO Needs to be removed.
		 */
		onChangeEvent(ev) {
			if (ev.target !== this.host) {
				this.event = ev;
				ev.stopImmediatePropagation();
				ev.stopPropagation();
			}
		},

		onChange() {
			if (this.selected && this.selected.value === this.value) return;

			this.setSelected(
				(this.options &&
					this.options.find(o => o.value === this.value)) ||
					null
			);
		},

		onAction(ev) {
			if (this.options.indexOf(ev.target) !== -1) {
				this.setSelected(ev.target);
				ev.stopImmediatePropagation();
				ev.stopPropagation();
			}
		},

		setSelected(el) {
			this.selected = el;
		},

		onSelected() {
			this.$behavior.next(this.selected);
		},
	});

	directive('registable', {
		connect() {
			cxl.dom.trigger(
				this.owner.host,
				(this.parameter || 'registable') + '.register'
			);
		},

		disconnect() {
			cxl.dom.trigger(
				this.owner.host,
				(this.parameter || 'registable') + '.unregister'
			);
		},
	});

	directive('registable.host', {
		initialize() {
			this.value = [];
		},

		connect() {
			const prefix = this.parameter || 'registable';
			this.bindings = [
				new cxl.EventListener(
					this.element,
					prefix + '.register',
					this.register.bind(this)
				),
				new cxl.EventListener(
					this.element,
					prefix + '.unregister',
					this.unregister.bind(this)
				),
			];
		},

		register(ev) {
			const el = ev.target;
			if (this.value.indexOf(el) === -1) this.value.push(el);

			this.set(this.value);
		},

		unregister(ev) {
			const i = this.value.indexOf(ev.target);

			if (i !== -1) this.value.splice(i, 1);

			this.set(this.value);
		},
	});

	component({
		name: 'cxl-meta',
		initialize() {
			function meta(name, content) {
				document.head.appendChild(
					cxl.dom('meta', { name: name, content: content })
				);
			}
			document.documentElement.lang = 'en-US';

			meta('viewport', 'width=device-width, initial-scale=1');
			meta('apple-mobile-web-app-capable', 'yes');
			meta('mobile-web-app-capable', 'yes');

			const style = document.createElement('STYLE');
			style.innerHTML = 'body,html{padding:0;margin:0;height:100%}';
			document.head.appendChild(style);
			const font = cxl.dom('link', {
				rel: 'stylesheet',
				href:
					'https://fonts.googleapis.com/css?family=Roboto:300,400,500',
			});
			document.head.appendChild(font);
		},
	});

	component(
		{
			name: 'cxl-menu-toggle',
			attributes: ['disabled', 'touched', 'icon'],
			template: `
<div &=".menu action:event.stop:not:=showMenu">
<cxl-menu dense closed &="id(menu) .menuControl =showMenu:not:@closed content"></cxl-menu>
</div>
<cxl-icon &=".icon =icon:@icon"></cxl-icon>
	`,
			bindings: `
id(self) focusable root.on(touchend):#close root.on(click):#close keypress(escape):#close action:#show:event.stop role(button)
	`,
			styles: [{}, DisabledCSS],
		},
		{
			icon: 'ellipsis-v',
			flat: true,
			showMenu: false,
			itemSelector: 'cxl-item:not([disabled])',
			close() {
				this.showMenu = false;
			},
			show(ev, el) {
				this.showMenu = true;
				this.menu.style.right =
					'calc(100% - ' + (el.offsetLeft + el.offsetWidth) + 'px)';

				const item = cxl.dom.find(el, this.itemSelector);

				if (item) item.focus();
			},
		}
	);

	Object.assign(ui, {
		alert(options) {
			if (typeof options === 'string') options = { message: options };

			const modal = cxl.dom('cxl-dialog-alert', options);

			document.body.appendChild(modal);

			return modal.promise;
		},

		/**
		 * Confirmation dialog
		 */
		confirm(options) {
			if (typeof options === 'string') options = { message: options };

			const modal = cxl.dom('cxl-dialog-confirm', options);

			document.body.appendChild(modal);

			return modal.promise;
		},

		notify(options) {
			let bar = ui.snackbarContainer;

			if (typeof options === 'string') options = { content: options };

			if (!bar) {
				bar = ui.snackbarContainer = cxl.dom('cxl-snackbar-container');
				document.body.appendChild(bar);
			}

			const snackbar = cxl.dom('cxl-snackbar', options);

			if (options.content) cxl.dom.insert(snackbar, options.content);

			bar.notify(snackbar);
		},

		ripple(hostEl, ev) {
			const x = ev.x,
				y = ev.y,
				rect = hostEl.getBoundingClientRect(),
				radius = rect.width > rect.height ? rect.width : rect.height,
				ripple = cxl.dom('cxl-ripple', {
					x: x === undefined ? rect.width / 2 : x - rect.left,
					y: y === undefined ? rect.height / 2 : y - rect.top,
					radius: radius,
				}),
				// Add to shadow root if present to avoid layout changes
				parent = hostEl.shadowRoot || hostEl;
			parent.appendChild(ripple);
		},
	});
})(this.cxl);
