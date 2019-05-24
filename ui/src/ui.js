(cxl => {
"use strict";

const
	component = cxl.component,
	behavior = cxl.behavior,
	directive = cxl.directive,
	ui = cxl.ui = {
		icons: {}
	},

	FocusCSS = {
		$active: { state: 'active' },
		$hover: { state: 'hover' },
		$focus: { state: 'focus' }
	},

	FocusCircleCSS = {
		$focus: { outline: 0 },
		focusCircle: {
			position: 'absolute', width: 48, height: 48, backgroundColor: '#ccc', borderRadius: 24,
			opacity: 0, scaleX: 0, scaleY: 0, display: 'inline-block',
			translateX: -14, translateY: -14
		},
		focusCirclePrimary: { backgroundColor: 'primary' },
		focusCircle$invalid$touched: { backgroundColor: 'error' },
		focusCircle$hover: { scaleX: 1, scaleY: 1, translateX: -14, translateY: -14, opacity: 0.14 },
		focusCircle$focus: { scaleX: 1, scaleY: 1, translateX: -14, translateY: -14, opacity: 0.25 },
		focusCircle$disabled: { scaleX: 0, scaleY: 0 }
	},

	DisabledCSS = {
		$disabled: { cursor: 'default', state: 'disabled' },
		$active$disabled: { state: 'disabled' },
		$hover$disabled: { state: 'disabled' }
	}
;

function prefix(prefix, css)
{
	var result = {}, i;

	for (i in css)
		result[prefix + i] = css[i];

	return result;
}


behavior('ripple', {
	bindings: '@disabled:=disabled on(mousedown):=event keypress:#onKey =event:#ripple',

	ripple(ev, el)
	{
		if (!this.disabled && ev) {
			ui.ripple(el, ev);
			this.$behavior.next(ev);
		}
	},

	onKey(ev)
	{
		if (ev.key==='Enter' || ev.key===' ')
		{
			this.event = ev;
			ev.preventDefault();
		}
	}
});

behavior('navigation.grid', {
	bindings: 'keypress:#onKey:event.prevent',
	onKey(ev, el)
	{
	const
		focused = el.querySelector(':focus'),
		children = new cxl.ElementChildren(el)
	;
		if (!focused)
			return;

		var cols = el.columns, next = focused;

		switch (ev.key) {
		case 'ArrowUp':
			while (cols--) next = children.previousTo(next);
			break;
		case 'ArrowDown':
			while (cols--) next = children.nextTo(next);
			break;
		case 'ArrowLeft': next = children.previousTo(next); break;
		case 'ArrowRight': next = children.nextTo(next); break;
		default: return cxl.Skip;
		}

		if (next)
			this.$behavior.next(next);
	}
});

behavior('navigation.select', {
	bindings: 'keypress:#onKey:event.prevent',
	onKey(ev, host)
	{
	var
		el = this.$behavior.value,
		children = new cxl.ElementChildren(host),
		key = ev.key
	;
		switch (key) {
		case 'ArrowDown':
			el = el ? children.nextTo(el) || el : children.first;
			break;
		case 'ArrowUp':
			el = el ? children.previousTo(el) || el : children.last;
			break;
		default:
			key = key.toLowerCase();

			function findByFirst(item)
			{
				return item.innerText && item.innerText.charAt(0).toLowerCase()===key;
			}
			// TODO ?
			if (/^[a-z]$/.test(key))
				el = cxl.dom.findNext(el, findByFirst) || cxl.dom.find(host, findByFirst) || this.selected;
			else
				return cxl.Skip;
		}

		this.$behavior.next(el);
	}
});

behavior('navigation.list', {
	bindings: 'keypress:#onKey:event.prevent',
	onKey(ev, host)
	{
	var
		children = new cxl.ElementChildren(host),
		el = children.focused,
		key = ev.key
	;
		switch (key) {
		case 'ArrowDown':
			do {
				el = el ? children.nextTo(el) || el : children.first;
			} while (el && el.tabIndex === -1 && el !== children.first);

			break;
		case 'ArrowUp':
			do {
				el = el ? children.previousTo(el) || el : children.last;
			} while (el && el.tabIndex === -1 && el !== children.last);

			break;
		default:
			return cxl.Skip;
		}

		this.$behavior.next(el);
	}
});

behavior('touchable', `
	on(blur):bool:@touched
	@touched:host.trigger(focusable.touched)
`);
behavior('focusable.events', `
	on(focus):host.trigger(focusable.focus)
	on(blur):host.trigger(focusable.blur)
`);
behavior('focusable', `
	@disabled:aria.prop(disabled):not:focus.enable
	focusable.events
`);
behavior('selectable', `
	registable(selectable)
	action:host.trigger(selectable.action)
	@selected:aria.prop(selected)
`);
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
	onChangeEvent(ev)
	{
		if (ev.target!==this.host)
		{
			this.event =ev;
			ev.stopImmediatePropagation();
			ev.stopPropagation();
		}
	},

	onChange()
	{
		if (this.selected && this.selected.value===this.value)
			return;

		this.setSelected(this.options && this.options.find(o => o.value===this.value) || null);
	},

	onAction(ev)
	{
		if (this.options.indexOf(ev.target)!==-1)
		{
			this.setSelected(ev.target);
			ev.stopImmediatePropagation();
			ev.stopPropagation();
		}
	},

	setSelected(el)
	{
		this.selected = el;
	},

	onSelected()
	{
		this.$behavior.next(this.selected);
	}
});

directive('aria.prop', {

	initialize()
	{
		const view = this.element.$view;

		if (view)
		{
			// TODO keep here?
			const states = view.$ariaStates || (view.$ariaStates = []);
			states.push('aria-' + this.parameter);
		}
	},

	digest()
	{
		this.digest = null;
		return this.update(true);
	},

	update(val)
	{
		if (val===undefined || val===null)
			val = false;

		this.element.setAttribute('aria-' + this.parameter, val);
	}

});

directive('role', {
	connect()
	{
		if (!this.element.hasAttribute('role'))
			this.element.setAttribute('role', this.parameter);
	}
});

directive('registable', {
	connect()
	{
		cxl.dom.trigger(this.owner.host, (this.parameter || 'registable') + '.register');
	},

	disconnect()
	{
		cxl.dom.trigger(this.owner.host, (this.parameter || 'registable') + '.unregister');
	}
});

directive('registable.host', {

	initialize()
	{
		this.value = [];
	},

	connect()
	{
		const prefix = this.parameter || 'registable';
		this.bindings = [
			new cxl.EventListener(this.element, prefix + '.register', this.register.bind(this)),
			new cxl.EventListener(this.element, prefix + '.unregister', this.unregister.bind(this))
		];
	},

	register(ev)
	{
		const el = ev.target;
		if (this.value.indexOf(el)===-1)
			this.value.push(el);

		this.set(this.value);
	},

	unregister(ev)
	{
		const i = this.value.indexOf(ev.target);

		if (i!==-1)
			this.value.splice(i, 1);

		this.set(this.value);
	}
});

component({
	name: 'cxl-appbar',
	attributes: [ 'extended' ],
	bindings: 'role(heading) =ariaLevel:|attribute(aria-level)',
	template: `
<div &=".flex content anchor(cxl-appbar-actions)"></div>
<div &="content(cxl-tabs) anchor(cxl-appbar-tabs)"></div>
	`,
	styles: {
		flex: {
			display: 'flex', alignItems: 'center', height: 56,
			paddingLeft: 16, paddingRight: 16, paddingTop: 4, paddingBottom: 4
		},
		$: {
			backgroundColor: 'primary', flexShrink: 0,
			fontSize: 18, color: 'onPrimary', elevation: 2
		},
		$fixed: { position: 'fixed', top: 0, right: 0, left: 0 },
		flex$extended: { alignItems: 'start', height: 128, paddingBottom: 24 },
		flex$medium: { paddingTop: 8, paddingBottom: 8 }
	}
}, {
	ariaLevel: 1
});

component({
	name: 'cxl-appbar-title',
	bindings: 'role(heading)',
	attributes: [ 'extended' ],
	styles: {
		$: { flexGrow: 1 },
		$extended: { fontSize: 24, alignSelf: 'flex-end' }
	}
});

component({
	name: 'cxl-avatar',
	attributes: [ 'big', 'src', 'text', 'little', 'alt' ],
	bindings: 'role(img) =alt:aria.prop(label)"',
	template: `<img &=".image =src:show:attribute(src) =alt:attribute(alt)" /><div &="=text:show:text =src:hide"></div><cxl-icon icon="user" &=".image"></cxl-icon>`,
	styles: {
		$: {
			borderRadius: 32, backgroundColor: 'surface',
			width: 40, height: 40, display: 'inline-block', fontSize: 18, lineHeight: 38,
			textAlign: 'center', overflowY: 'hidden'
		},
		$little: { width: 32, height: 32, fontSize: 16, lineHeight: 30 },
		$big: { width: 64, height: 64, fontSize: 36, lineHeight: 62 },
		image: { width: '100%', height: '100%', borderRadius: 32 }
	}

}, {
	alt: 'Avatar'
});

component({
	name: 'cxl-backdrop',
	styles: {
		$: {
			position: 'absolute', top: 0, left: 0, bottom: 0, width: '100%',
			backgroundColor: 'rgba(0,0,0,0.32)', elevation: 5
		}
	}
});

component({
	name: 'cxl-block',
	styles: {
		$: { padding: 16 }
	}
});

component({
	name: 'cxl-button',
	attributes: [ 'disabled', 'primary', 'flat', 'secondary', 'touched', 'big', 'value' ],
	bindings: 'focusable ripple role(button) action:#onAction',
	styles: [FocusCSS, {
		$: {
			elevation: 1, paddingTop: 8, paddingBottom: 8, paddingRight: 16,
			paddingLeft: 16, cursor: 'pointer', display: 'inline-block', position: 'relative',
			font: 'button', borderRadius: 2, userSelect: 'none',
			backgroundColor: 'surface', color: 'onSurface', textAlign: 'center'
		},

		$big: { padding: 16, fontSize: 22 },
		$flat: {
			backgroundColor: 'surface',
			elevation: 0, fontWeight: 500, paddingRight: 8, paddingLeft: 8, color: 'link'
		},
		$flat$large: { paddingLeft: 12, paddingRight: 12 },

		$primary: { backgroundColor: 'primary', color: 'onPrimary' },
		$secondary: { backgroundColor: 'secondary', color: 'onSecondary' },

		$active: { elevation: 3 },
		$active$disabled: { elevation: 1 },
		$active$flat$disabled: { elevation: 0 }
	}, DisabledCSS ]
}, {

	onAction(ev)
	{
		if (this.disabled)
		{
			ev.stopPropagation();
			ev.stopImmediatePropagation();
		}
	}

});

component({
	name: 'cxl-c',
	styles: (r => {
		for (let i=12; i>0; i--)
			r[5]['$xl'+i+'$xlarge'] = r[4]['$lg'+i + '$large'] = r[3]['$md'+i+'$medium'] =
			r[2]['$sm'+i+'$small'] = r[1]['$xs'+i] = { display: 'block', gridColumnEnd: 'span ' + i };
		return r;
	})([{
		$: { gridColumnEnd: 'span 12', flexShrink: 0 },
		$grow: { flexGrow: 1, flexShrink: 1 },
		$small: { gridColumnEnd: 'auto' },
		$fill: { position: 'absolute', top:0, left:0, right:0, bottom:0 },
 		$xl0$xlarge: { display: 'none' },
		$lg0$large: { display: 'none' },
		$md0$medium: { display: 'none' },
		$sm0$small: { display: 'none' },
		$xs0: { display: 'none' },
		// Padding
		$pad16: { padding: 16 },
		$pad8: { padding: 8 },
		$pad24: { padding: 24 },
		// Colors
		$surface: { backgroundColor: 'surface', color: 'onSurface' },
		$error: { backgroundColor: 'error', color: 'onError' },
		$primary: { backgroundColor: 'primary', color: 'onPrimary' },
		$secondary: { backgroundColor: 'secondary', color: 'onSecondary' },
	}, {}, {}, {}, {}, {}, { $flex: { display: 'flex' }, $vflex: { display: 'flex', flexDirection: 'column' } } ])
});

component({
	name: 'cxl-card',
	styles: { $: {
		elevation: 1, borderRadius: 2, backgroundColor: 'surface',
		color: 'onSurface'
	} }
});

component({
	name: 'cxl-chip',
	attributes: [ 'removable', 'disabled', 'touched', 'primary', 'secondary', 'little' ],
	events: [ 'cxl-chip.remove' ],
	bindings: 'focusable keypress:#onKey',
	template: `
<span &=".avatar content(cxl-avatar)"></span><span &=".content content"></span><cxl-icon &=".remove =removable:show on(click):host.trigger(cxl-chip.remove)" icon="times"></cxl-icon>
	`,
	styles: [{
		$: {
			borderRadius: 16, fontSize: 14, backgroundColor: 'divider',
			display: 'inline-flex', color: 'onSurface', lineHeight: 32, height: 32
		},
		$primary: { color: 'onPrimary', backgroundColor: 'primary' },
		$secondary: { color: 'onSecondary', backgroundColor: 'secondary' },
		$little: { fontSize: 12, lineHeight: 20, height: 20 },
		content: { display: 'inline-block', marginLeft: 12, paddingRight: 12 },
		avatar: { display: 'inline-block' },
		remove: { display: 'inline-block', marginRight: 12, cursor: 'pointer' }
	}, FocusCSS ]
}, {
	onKey(ev, el)
	{
		if (this.removable && (ev.key==='Delete' || ev.key==='Backspace'))
			cxl.dom.trigger(el, 'cxl-chip.remove');
	}
});

component({
	name: 'cxl-content',
	attributes: [ 'center' ],
	styles: {
		$: { margin: 16 },
		$medium: { margin: 32 },
		$large: { margin: 64 },
		$xlarge: { width: 1200 },
		$xlarge$center: { marginLeft: 'auto', marginRight: 'auto' }
	}
});

component({
	name: 'cxl-dialog',
	template: '<cxl-backdrop><div &=".content content"></div></cxl-backdrop>',
	bindings: 'role(dialog)',
	styles: {
		content: {
			backgroundColor: 'surface', position: 'absolute',
			top: 0, left: 0, right: 0, bottom: 0, color: 'onSurface'
		},
		content$small: {
			elevation: 12, translateY: '-50%', top: '50%', bottom: 'auto',
			width: '80%', marginLeft: 'auto', marginRight: 'auto'
		}
	}
});

component({
	name: 'cxl-dialog-alert',
	attributes: [ 'title-text', 'message', 'promise' ],
	bindings: 'role(alertdialog) =modal:aria.prop(modal) =title-text:aria.prop(label)',
	template: `
<cxl-dialog>
	<div &=".content">
		<cxl-t h5 &="=title-text:show:text"></cxl-t>
		<div &="=message:text"></div>
	</div>
	<div &=".footer">
		<cxl-button flat &="=action:text action:#remove:#resolve"></cxl-button>
	</div>
</cxl-dialog>
	`,
	styles: {
		content: { padding: 16 },
		footer: { padding: 8 }
	},
	initialize(state) {
		state.$component = this;
		state.promise = new Promise(function(resolve, reject) {
			state.resolve = resolve;
			state.reject = reject;
		});
	}
}, {
	action: 'Ok',
	modal: true,
	remove()
	{
		this.$component.remove();
	}
});

component({
	name: 'cxl-dialog-confirm',
	attributes: [ 'cancel-text' ],
	template: `
<cxl-dialog>
	<div &=".content">
		<cxl-t h5 &="=title-text:show:text =title-text:aria.prop(label)"></cxl-t>
		<div &="=message:text"></div>
	</div>
	<div &=".footer">
		<cxl-button flat &="=cancel-text:text action:#remove:#reject"></cxl-button>
		<cxl-button flat &="=action:text action:#remove:#resolve"></cxl-button>
	</div>
</cxl-dialog>
	`,
	extend: 'cxl-dialog-alert'
}, {
	'cancel-text': 'Cancel',
	action: 'Confirm'
});

component({
	name: 'cxl-drawer',
	events: [ 'backdrop.click' ],
	template: `
<cxl-backdrop &=".backdrop on(click):host.trigger(backdrop.click)"></cxl-backdrop>
<div &="on(click):event.stop .drawer content"></div>
	`,
	attributes: [ 'visible', 'right', 'permanent' ],
	styles: {
		drawer: {
			backgroundColor: 'surface', position: 'absolute', top: 0, left: 0,
			width: '85%', bottom: 0, opacity: 0, color: 'onSurface',
			overflowY: 'auto', elevation: 5, translateX: '-105%'
		},
		drawer$right$permanent$xlarge: { translateX: '-100%', width: 320 },
		drawer$right: { left: '100%', width: 0, translateX: 0 },
		drawer$right$visible: { translateX: '-100%', width: 320 },

		drawer$small: { width: 288 },
		drawer$large$permanent: { translateX: 0, opacity: 1 },
		drawer$visible: { translateX: 0, opacity: 1 },

		backdrop: { width: 0, opacity: 0 },
		backdrop$visible: { width: '100%', opacity: 1 },
		backdrop$visible$permanent$large: { width: 0 },
		backdrop$visible$right$large: { width: '100%' },
		backdrop$visible$permanent$right$xlarge: { width: 0 }
	}
});

component({
	name: 'cxl-fab',
	attributes: [ 'disabled', 'touched', 'static' ],
	bindings: 'focusable',
	styles: [{
		$: {
			elevation: 2, backgroundColor: 'secondary', color: 'onSecondary',
			position: 'fixed', width: 56, height: 56, bottom: 16, right: 24,
			borderRadius: 56, textAlign: 'center', paddingTop: 20, cursor: 'pointer',
			fontSize: 20, paddingBottom: 20, lineHeight: 16
		},
		$static: { position: 'static' },
		$focus: { elevation: 4 },
		$small: { top: 28, bottom: '' }
	}, FocusCSS ]
});

component({
	name: 'cxl-grid',
	attributes: [ 'rows', 'columns', 'gap' ],
	bindings: `
=rows:style.inline(gridTemplateRows)
=columns:#setColumns
=gap:style.inline(gridGap)
	`,
	styles: {
		$: { display: 'grid' },
		$pad16: { padding: 16 },
		$pad8: { padding: 8 },
		$pad24: { padding: 24 }
	}
}, {
	// TODO
	columns: 'repeat(12, 1fr)',
	gap: '16px 16px',
	setColumns(val, el)
	{
		el.style.gridTemplateColumns = val;
	}
});

component({
	name: 'cxl-hr',
	bindings: 'role(separator)',
	styles: { $: {
		border: 0, borderBottom: 1,
		borderColor: '#ccc', borderStyle: 'solid' }
	}
});

component({
	name: 'cxl-icon',
	bindings: 'role(img) =icon:#setIcon',
	attributes: [ 'icon' ],
	styles: {
		$: { display: 'inline-block', fontFamily: 'Font Awesome\\ 5 Free' },
		$round: {
			borderRadius: '50%', width: '1.375em', height: '1.375em',
			lineHeight: '1.375em', textAlign: 'center'
		},
		$outline: { borderWidth: 1, borderStyle: 'solid' }
	}
}, {
	setIcon(val, el)
	{
		const icon = ui.icons[this.icon];

		if (icon)
		{
			if (this.iconNode)
				el.removeChild(this.iconNode);

			this.iconNode = document.createTextNode(icon);
			el.appendChild(this.iconNode);

			if (!el.hasAttribute('alt'))
				cxl.dom.setAttribute(el, 'alt', this.icon);
		}
	}
});

/*component({
	name: 'cxl-list',
	styles: {
		$: { paddingTop: 8, paddingBottom: 8 }
	},
	bindings: '=tabIndex:@tabIndex navigation.list:#onNav'
}, {
	tabIndex: -1,
	onNav(el) { if (el) el.focus(); }
});*/

component({
	name: 'cxl-item',
	template: `
<a &=".link =href:attribute(href)" tabindex="-1">
	<cxl-icon role="presentation" &="=icon:show:@icon .icon"></cxl-icon>
	<div &=".content content"></div>
</a>
	`,
	bindings: `
focusable ripple role(listitem)
	`,
	attributes: [ 'href', 'icon', 'selected', 'disabled', 'touched' ],
	styles: [ prefix('link', FocusCSS), {
		$: { cursor: 'pointer', fontSize: 16, position: 'relative' },
		'link:focus': { outline: 0 },
		link: {
			color: 'onSurface', lineHeight: 24, paddingRight: 16, paddingLeft: 16,
			paddingTop: 12, paddingBottom: 12, alignItems: 'center',
			backgroundColor: 'surface', textDecoration: 'none', display: 'flex'
		},
		content: { flexGrow: 1 },
		icon: { marginRight: 16, width: 28, color: 'onSurface', opacity: 0.7 },
		icon$selected: { color: 'onPrimaryLight' },
		link$selected: { backgroundColor: 'primaryLight', color: 'onPrimaryLight' }
	}, prefix('link', DisabledCSS) ]

});

component({
	name: 'cxl-menu',
	styles: {
		$: {
			elevation: 1, display: 'inline-block',
			backgroundColor: 'surface', overflowY: 'auto', color: 'onSurface',
			paddingTop: 8, paddingBottom: 8
		},
		$dense: { paddingTop: 0, paddingBottom: 0 },
		$closed: { scaleY: 0 }
	},
	attributes: [ 'closed', 'dense' ],
	methods: [ 'focus' ],
	bindings: '=tabIndex:@tabIndex id(self) role(list) navigation.list:#onNav'
}, {
	tabIndex: -1,
	itemSelector: 'cxl-item:not([disabled])',

	focus()
	{
		const item = cxl.dom.find(this.self, this.itemSelector);

		if (item)
			item.focus();
	},

	onNav(el)
	{
		el.focus();
	}
});

component({
	name: 'cxl-meta',
	initialize()
	{
		function meta(name, content)
		{
			document.head.appendChild(cxl.dom('meta', { name: name, content: content }));
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
			href: 'https://fonts.googleapis.com/css?family=Roboto:300,400,500'
		});
		document.head.appendChild(font);
	}
});

component({
	name: 'cxl-toggle',
	attributes: [ 'disabled', 'touched', 'opened' ],
	template: `
<div &="content"></div>
<div &="id(popup) =opened:show .popup content(cxl-toggle-popup)"></div>
	`,
	bindings: `
focusable
root.on(click):#close keypress(escape):#close
action:#show:event.stop
role(button)
	`,
	styles: {
		popup: { height: 0, elevation: 5, position: 'absolute' }
	}
}, {
	opened: false,
	close()
	{
		this.opened = false;
	},
	show()
	{
		if (this.disabled)
			return;

		if (!this.opened)
		{
			this.opened = true;
			this.popup.style.right = 0; //'calc(100% - ' + (el.offsetLeft + el.offsetWidth) + 'px)';
		} else
			this.close();
	}
});

component({
	name: 'cxl-icon-toggle',
	attributes: [ 'icon' ],
	extend: 'cxl-toggle',
	template: `
<span &="=opened:hide .focusCircle .focusCirclePrimary"></span>
<cxl-icon &="=icon:@icon"></cxl-icon>
<div &="id(popup) =opened:show .popup content(cxl-toggle-popup)"></div>
	`,
	styles: [ FocusCircleCSS, {
		$: {
			paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12,
			cursor: 'pointer', position: 'relative'
		},
		focusCircle: { left: -4 }
	}]
});

component({
	name: 'cxl-menu-toggle',
	attributes: [ 'disabled', 'touched' ],
	template: `
<div &=".menu action:event.stop:not:=showMenu">
<cxl-menu dense closed &="id(menu) .menuControl =showMenu:not:@closed content"></cxl-menu>
</div>
<cxl-icon &=".icon" icon="ellipsis-v"></cxl-icon>
	`,
	bindings: `
id(self) focusable root.on(touchend):#close root.on(click):#close keypress(escape):#close action:#show:event.stop role(button)
	`,
	styles: {
		icon: {
			cursor: 'pointer', width: 8
		},
		menuControl: {
			position: 'absolute', transformOrigin: 'right top', textAlign: 'left',
			right: 0
		},
		menu: {
			height: 0, textAlign: 'right', elevation: 5
		}
	}
}, {
	flat: true,
	showMenu: false,
	itemSelector: 'cxl-item:not([disabled])',
	close()
	{
		this.showMenu = false;
	},
	show(ev, el)
	{
		this.showMenu = true;
		this.menu.style.right = 'calc(100% - ' + (el.offsetLeft + el.offsetWidth) + 'px)';

		const item = cxl.dom.find(el, this.itemSelector);

		if (item)
			item.focus();
	}
});

component({
	name: 'cxl-navbar',
	attributes: [ 'permanent' ],
	bindings: 'role(navigation)',
	template: `
<cxl-drawer &="role(list) action:#onRoute =permanent:@permanent =visible:@visible content location:#onRoute"></cxl-drawer>
<cxl-icon alt="Open Navigation Bar" &="action:#toggle .toggler" icon="bars"></cxl-icon>
	`,
	styles: {
		$: {
			display: 'inline-block', fontSize: 16,
			marginTop: 8, marginBottom: 8, overflowScrolling: 'touch'
		},
		toggler: {
			width: 16, marginRight: 32, cursor: 'pointer'
		},
		toggler$permanent$large: { display: 'none' }
	}
}, {
	permanent: false,
	visible: false,
	toggle() { this.visible = !this.visible; },

	onRoute()
	{
		this.visible=false;
	}

});

component({
	name: 'cxl-progress',
	events: [ 'change' ],
	attributes: [ 'value' ],
	bindings: 'role(progressbar)',
	template: `
<div &=".indicator =value:host.trigger(change):#setValue:.indeterminate"></div>
	`,
	styles: {
		$: { backgroundColor: 'primaryLight', height: 4 },
		indicator: { backgroundColor: 'primary', height: 4, transformOrigin: 'left' },
		indeterminate: { animation: 'wait' }
	}
}, {
	value: null,

	setValue(val, el)
	{
		if (val!==null)
		{
			el.style.transform = 'scaleX(' + val + ')';
			return cxl.Skip;
		}

		return true;
	}
});

component({
	name: 'cxl-ripple',
	attributes: [ 'x', 'y', 'radius' ],
	bindings: 'id(host) connect:#connect',
	template: `<div &="id(ripple) on(animationend):#end .ripple"></div>`,
	styles: {
		$: {
			position: 'absolute', overflowX: 'hidden', overflowY: 'hidden',
			top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none'
		},
		ripple: {
			position: 'relative', borderRadius: '100%', scaleX: 0, scaleY: 0,
			backgroundColor: 'onSurface', opacity: 0.16,
			animation: 'expand', animationDuration: '0.4s'
		},
		ripple$primary: { backgroundColor: 'primary' },
		ripple$secondary: { backgroundColor: 'secondary' }
	}
}, {
	connect()
	{
	const
		style = this.ripple.style
	;
		style.left = (this.x - this.radius) + 'px';
		style.top = (this.y - this.radius) + 'px';
		style.width = style.height = this.radius*2 + 'px';
	},

	end()
	{
		cxl.dom.remove(this.host);
	}
});

component({
	name: 'cxl-ripple-container',
	attributes: [ 'disabled' ],
	styles: {
		$: { position: 'relative', overflowX: 'hidden', overflowY: 'hidden' }
	},
	bindings: 'ripple'
});

component({
	name: 'cxl-snackbar',
	attributes: [ 'delay' ],
	styles: {
		$: {
			display: 'block', opacity: 0, scaleX: 0.5, scaleY: 0.5,
			padding: 16, elevation: 3, backgroundColor: '#333', color: '#eee', marginBottom: 16
		},

		$small: { display: 'inline-block' }
	},
	bindings: 'connect:#connect'
}, {
	connect(val, host)
	{
		// TODO better way to animate?
		setTimeout(() => {
			host.style.opacity = 1;
			host.style.transform = 'scale(1,1)';
		}, 50);
	},

	delay: 4000
});

component({
	name: 'cxl-snackbar-container',
	bindings: 'connect:#connect',

	styles: {
		$: { position: 'fixed', left: 16, bottom: 16, right: 16, textAlign: 'center' },
		$left: { textAlign: 'left' },
		$right: { textAlign: 'right' }
	},

	initialize(state)
	{
		state.host = this;
		state.queue = [];
	},

	methods: [ 'notify' ]

}, {

	queue: null,

	connect(val, host)
	{
		ui.snackbarContainer = host;
	},

	notifyNext()
	{
		const next = this.queue[0];

		cxl.dom.insert(this.host, next);

		setTimeout(() => {
			cxl.dom.remove(next);

			this.queue.shift();

			if (this.queue.length)
				this.notifyNext();
		}, next.delay);
	},

	notify(snackbar)
	{
		this.queue.push(snackbar);

		if (this.queue.length===1)
			this.notifyNext();
	}

});

cxl.css.animation.spinnerstroke = {
	keyframes: `
0%      { stroke-dashoffset: $start;  transform: rotate(0); }
12.5%   { stroke-dashoffset: $end;    transform: rotate(0); }
12.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(72.5deg); }
25%     { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(72.5deg); }
25.0001%   { stroke-dashoffset: $start;  transform: rotate(270deg); }
37.5%   { stroke-dashoffset: $end;    transform: rotate(270deg); }
37.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(161.5deg); }
50%     { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(161.5deg); }
50.0001%  { stroke-dashoffset: $start;  transform: rotate(180deg); }
62.5%   { stroke-dashoffset: $end;    transform: rotate(180deg); }
62.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(251.5deg); }
75%     { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(251.5deg); }
75.0001%  { stroke-dashoffset: $start;  transform: rotate(90deg); }
87.5%   { stroke-dashoffset: $end;    transform: rotate(90deg); }
87.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(341.5deg); }
100%    { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(341.5deg); }
		`.replace(/\$start/g, 282.743 * (1-0.05))
		.replace(/\$end/g, 282.743 * (1-0.8)),
	value: 'cxl-spinnerstroke 4s infinite cubic-bezier(.35,0,.25,1)'
};

component({
	name: 'cxl-spinner',
	template: `<svg viewBox="0 0 100 100" style="width:100px;height:100px">
<circle cx="50%" cy="50%" r="45" style="stroke:var(--cxl-primary);fill:transparent;transition:stroke-dashoffset var(--cxl-speed);stroke-width:10%;transform-origin:center;stroke-dasharray:282.743px" &=".circle" /></svg>`,
	styles: {
		$: { animation: 'spin', display: 'inline-block' },
		circle: { animation: 'spinnerstroke' }
	}
});

component({
	name: 'cxl-t',
	attributes: [ 'font' ],
	bindings: '=font:gate:attribute',
	styles: {
		$: { font: 'default', marginBottom: 8 },
		$lastChild: { marginBottom: 0 },
		$inline: { display: 'inline' },

		$caption: { font: 'caption' },
		$h1: { font: 'h1', marginBottom: 64 },
		$h2: { font: 'h2', marginBottom: 48 },
		$h3: { font: 'h3', marginBottom: 32 },
		$h4: { font: 'h4', marginBottom: 24 },
		$h5: { font: 'h5', marginBottom: 16 },
		$h6: { font: 'h6', marginBottom: 16 },
		$button: { font: 'button' },
		$subtitle: { font: 'subtitle', marginBottom: 0 },
		$subtitle2: { font: 'subtitle2', opacity: 0.73 }
	}
});

component({
	name: 'cxl-tab',
	template: '<a &=".link =href:attribute(href) content"></a>',
	bindings: 'role(tab) focusable ripple =selected:filter:host.trigger(cxl-tab.selected)',
	attributes: ['href', 'selected', 'disabled', 'touched'],
	styles: [{
		$: { flexShrink: 0 },
		$small: { display: 'inline-block' },
		link: {
			padding: 16, paddingBottom: 12, border: 0, backgroundColor: 'primary',
			textTransform: 'uppercase', fontSize: 14, color: 'onPrimary', lineHeight: 20,
			textDecoration: 'none', textAlign: 'center', display: 'block'
		}
	}, FocusCSS]
}, {
	href: null,
	selected: false
});

component({
	name: 'cxl-table',
	attributes: [ 'columns' ],
	bindings: 'registable.host(table):=event =event:#updateColumns',
	styles: {
		$: { display: 'none', overflowX: 'auto' }
	}
}, {
	columns: 0,
	updateColumns(set, table)
	{
		if (set)
		{
			let columns = '';

			for (let th of set)
				columns += (th.width || 'auto') + ' ';

			this.columns = set.length;

			// TODO
			table.style.gridTemplateColumns = columns;
			table.style.display = 'grid';
		}
	}
});

component({
	name: 'cxl-th',
	attributes: ['width'],
	bindings: 'registable(table) role(columnheader)',
	styles: {
		$: {
			flexGrow: 1, fontSize: 12, color: 'headerText',
			paddingTop: 12, paddingBottom: 12, paddingLeft: 8, paddingRight: 8,
			borderBottom: '1px solid', borderColor: 'divider', lineHeight: 24
		}
	}
});

component({
	name: 'cxl-td',
	styles: {
		$: {
			paddingTop: 12, paddingBottom: 12, paddingLeft: 8, paddingRight: 8,
			flexGrow: 1, borderBottom: '1px solid', borderColor: 'divider'
		},
		$primary: { backgroundColor: 'primary', color: 'onPrimary' },
		$secondary: { backgroundColor: 'secondary', color: 'onSecondary' }
	}
});

component({
	name: 'cxl-tr',
	bindings: 'role(row)',
	styles: {
		$: { display: 'contents' }
	}
});

component({
	name: 'cxl-tabs',
	template: `<div &=".content content"></div><div &="id(indicator) .selected"></div>`,
	bindings: 'role(tablist) on(cxl-tab.selected):#onSelected =selected:#update',
	attributes: [ 'selected' ],
	styles: {
		$: {
			backgroundColor: 'primary', color: 'onPrimary', fontSize: 0,
			display: 'block', flexShrink: 0, position: 'relative', cursor: 'pointer',
			overflowX: 'auto'
		},
		selected: { backgroundColor: 'secondary', height: 4 },
		content: { display: 'flex' },
		content$small: { display: 'block' }
	}
}, {
	update(tab)
	{
		const bar = this.indicator;

		if (!tab)
			return (bar.style.width = 0);

		// Add delay so styles finish rendering...
		// TODO find better way
		requestAnimationFrame(() => {
			bar.style.transform = 'translate(' + tab.offsetLeft + 'px, 0)';
			bar.style.width = tab.clientWidth + 'px';
		}, 50);
	},

	onSelected(ev)
	{
		if (this.selected)
			this.selected.selected = false;

		this.selected = ev.target;
	}
});

Object.assign(ui, {

	alert(options)
	{
		if (typeof(options)==='string')
			options = { message: options };

		const modal = cxl.dom('cxl-dialog-alert', options);

		document.body.appendChild(modal);

		return modal.promise;
	},

	/**
	 * Confirmation dialog
	 */
	confirm(options)
	{
		if (typeof(options)==='string')
			options = { message: options };

		var modal = cxl.dom('cxl-dialog-confirm', options);

		document.body.appendChild(modal);

		return modal.promise;
	},

	notify(options)
	{
		var bar = ui.snackbarContainer;

		if (typeof(options)==='string')
			options = { content: options };

		if (!bar)
		{
			bar = cxl.dom('cxl-snackbar-container');
			document.body.appendChild(bar);
		}

		const snackbar = cxl.dom('cxl-snackbar', options);

		if (options.content)
			cxl.dom.insert(snackbar, options.content);

		bar.notify(snackbar);
	},

	ripple(hostEl, ev)
	{
	const
		x = ev.x, y = ev.y,
		rect = hostEl.getBoundingClientRect(),
		radius = (rect.width > rect.height ? rect.width : rect.height),
		ripple = cxl.dom('cxl-ripple', {
			x: x===undefined ? (rect.width/2) : x - rect.left,
			y: y===undefined ? (rect.height/2) : y - rect.top,
			radius: radius
		}),
		// Add to shadow root if present to avoid layout changes
		parent = hostEl.shadowRoot || hostEl
	;
		parent.appendChild(ripple);
	}

});

})(this.cxl);