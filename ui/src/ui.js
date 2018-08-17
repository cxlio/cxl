(cxl => {
"use strict";

const
	component = cxl.component,
	behavior = cxl.behavior,
	directive = cxl.directive,
	ui = cxl.ui = {
		icons: {}
	},
	theme = ui.theme = cxl.css({

		variables: {

			speed: '0.2s',

			primary: '#009688',
			primaryLight: '#b2dfdb',
			primaryDark: '#00796b',

			secondary: '#ff5722',
			//secondaryLight: '#ffc947',
			//secondaryDark: '#c66900',

			surface: '#fff',

			onPrimary: '#fff',
			onSecondary: '#fff',
			onSurface: '#212121',

			danger: '#ff1744'
		},

		global: {
			$: {
				display: 'block',
				reset: '-webkit-tap-highlight-color:transparent;',
				fontFamily: '-apple-system, BlinkMacSystemFont,"Segoe UI",Roboto, "Helvetica Neue", Arial, sans-serif'
			},
			'*': {
				boxSizing: 'border-box',
				transition: 'opacity var(--speed), transform var(--speed), box-shadow var(--speed), filter var(--speed)',
			}
		}

	}),

	FocusCSS = {
		$active: { filter: 'brightness(0.75)' },
		$active$primary: { filter: 'brightness(1.3)' },
		$active$secondary: { filter: 'brightness(1.8)' },

		$hover: { filter: 'brightness(0.95)' },
		$hover$primary: { filter: 'brightness(1.05)' },
		$hover$secondary: { filter: 'brightness(1.05)' },

		$focus: { outline: 0, filter: 'brightness(0.85)' },
		$focus$primary: { filter: 'brightness(1.2)' },
		$focus$secondary: { filter: 'brightness(1.4)' }
	},

	FocusCircleCSS = {
		$focus: { outline: 0 },
		focusCircle: {
			position: 'absolute', width: 48, height: 48, backgroundColor: '#ccc', borderRadius: 24,
			opacity: 0, scaleX: 0, scaleY: 0, display: 'inline-block',
			translateX: -14, translateY: -14
		},
		focusCirclePrimary: { backgroundColor: theme.primary },
		focusCircle$hover: { scaleX: 1, scaleY: 1, translateX: -14, translateY: -14, opacity: 0.14 },
		focusCircle$focus: { scaleX: 1, scaleY: 1, translateX: -14, translateY: -14, opacity: 0.25 },
		focusCircle$disabled: { scaleX: 0, scaleY: 0 }
	},

	FocusLineCSS = {
		$focus: { outline: 0 },
		focusLine: {
			position: 'relative', border: 0, borderTop: 2, borderStyle: 'solid',
			borderColor: theme.primary, scaleX: 0, top: -1
		},
		focusLine$invalid$touched: { borderColor: theme.danger },
		focusLine$inverse: { borderColor: theme.secondary },
		focusLine$focus: { scaleX: 1 }
	},

	DisabledCSS = {
		$disabled: { cursor: 'default', filter: 'saturate(0)', opacity: 0.38 },
		$active$disabled: { filter: 'saturate(0)', opacity: 0.38 },
		$hover$disabled: { filter: 'saturate(0)', opacity: 0.38 }
	}
;

function prefix(prefix, css)
{
	var result = {}, i;

	for (i in css)
		result[prefix + i] = css[i];

	return result;
}

/*component({
	name: 'cxl-animate',
	attributes: [ 'pulse', 'spin' ],
	styles: {
		$: { display: 'inline-block' },
		$pulse: { animation: 'pulse' },
		$spin: { animation: 'spin' }
	}
});

component({
	name: 'cxl-app',
	template: `
<div &="content(cxl-appbar)"></div>
<div &=".content content id(content)"></div>
	`,
	styles: {
		$large: { paddingLeft: 288 },
		content: {
			position: 'absolute', top: 56, overflowX: 'hidden',
			left: 0, right: 0, bottom: 0, scrollBehavior: 'smooth',
			overflowY: 'auto'
		},
		content$large: { top: 64, left: 288 }
	}
});
*/
behavior('focusable', `
	@disabled:not:focus.enable touchable
`);
behavior('touchable', `
	on(blur):event.stop:bool:@touched
	@touched:host.trigger(focusable.touched)
`);
behavior('selectable', `
	connect:host.trigger(selectable.register)
	disconnect:host.trigger(selectable.unregister)
`);
behavior('selectable.host', {
	bindings: `
id(host)
on(selectable.register):#register:=event
on(selectable.unregister):#unregister:=event
=event:#onChange

on(change):#onChangeEvent
on(action):#onAction
keypress:#onKey:event.prevent
@value:=value:#onChange
=selected:#onSelected
	`,

	selected: null,
	event: null,

	onChangeEvent(ev)
	{
		if (ev.target!==this.host)
		{
			this.onChange();
			ev.stopImmediatePropagation();
			ev.stopPropagation();
		}
	},

	register(ev)
	{
		const options = this.options || (this.options=[]);
		options.push(ev.target);
	},

	unregister(ev)
	{
		const options = this.options;
		options.splice(options.indexOf(ev.target), 1);
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
		if (this.selected)
			this.selected.selected = false;

		if (el)
			el.selected = true;

		this.selected = el;
	},

	itemSelector(item)
	{
		// TODO prob slow...
		return this.options.indexOf(item)!==-1;
	},

	onKey(ev)
	{
	var
		selector = this.itemSelector.bind(this),
		el = this.selected || cxl.dom.find(this.host, selector)
	;
		switch (ev.key) {
		case 'ArrowDown':
			if ((el = el && cxl.dom.findNext(el, selector)))
				this.setSelected(el);
			break;
		case 'ArrowUp':
			if ((el = el && cxl.dom.findPrevious(el, selector)))
				this.setSelected(el);
			break;
		default:
			return cxl.Skip;
		}
	},

	onSelected()
	{
		this.$behavior.next(this.selected);
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
		this.value = new Set();
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
		this.value.add(ev.target);
		this.set(this.value);
	},

	unregister(ev)
	{
		this.value.delete(ev.target);
		this.set(this.value);
	}
});

component({
	name: 'cxl-appbar',
	template: '<div &=".flex content anchor(cxl-appbar-actions)"></div><div &="content(cxl-tabs) anchor(cxl-appbar-tabs)"></div>',
	styles: {
		flex: {
			display: 'flex', alignItems: 'center', height: 56,
			paddingLeft: 16, paddingRight: 16, paddingTop: 4, paddingBottom: 4
		},
		$: {
			backgroundColor: theme.primary, flexShrink: 0,
			fontSize: 18, color: theme.onPrimary, elevation: 2
		},
		flex$medium: { paddingTop: 8, paddingBottom: 8 }
	}
});

component({
	name: 'cxl-avatar',
	attributes: [ 'big', 'src', 'text', 'little' ],
	template: `<img &=".image =src:show:attribute(src)" /><div &="=text:show:text =src:hide"></div><cxl-icon icon="user" &=".image"></cxl-icon>`,
	styles: {
		$: {
			borderRadius: 32, backgroundColor: theme.surface,
			width: 40, height: 40, display: 'inline-block', fontSize: 18, lineHeight: 38,
			textAlign: 'center', overflowY: 'hidden'
		},
		$little: { width: 32, height: 32, fontSize: 16, lineHeight: 30 },
		$big: { width: 64, height: 64, fontSize: 36, lineHeight: 62 },
		image: { width: '100%', height: '100%', borderRadius: 32 }
	}

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
	attributes: [
		'inverse', 'compact', 'surface', 'primary', 'secondary', 'flex', 'vflex', 'scroll'
	],
	styles: {
		$: { padding: 16 },
		$compact: { padding: 8 },
		$surface: { backgroundColor: theme.surface, color: theme.onSurface },
		$primary: { backgroundColor: theme.primary, color: theme.onPrimary },
		$secondary: { backgroundColor: theme.secondary, color: theme.onSecondary },

		$inverse: { color: theme.onPrimary, backgroundColor: theme.primaryDark },
		$flex: { display: 'flex' },
		$vflex: { display: 'flex', flexDirection: 'vertical' },
		$scroll: { overflowY: 'auto' }
	}
});

component({
	name: 'cxl-button',
	attributes: [ 'disabled', 'primary', 'flat', 'secondary', 'inverse', 'touched' ],
	events: [ 'action' ],
	bindings: 'focusable action:#onAction:host.trigger(action)',
	styles: [FocusCSS, {
		$: {
			elevation: 1, paddingTop: 8, paddingBottom: 8, lineHeight: 20, paddingRight: 16,
			paddingLeft: 16, cursor: 'pointer', display: 'inline-block', textTransform: 'uppercase',
			borderRadius: 2, userSelect: 'none', backgroundColor: theme.surface,
			color: theme.onSurface, textAlign: 'center'
		},

		$primary: { backgroundColor: theme.primary, color: theme.onPrimary },
		$secondary: { backgroundColor: theme.secondary, color: theme.onSecondary },

		$flat: {
			backgroundColor: 'inherit',
			elevation: 0, fontWeight: 500, paddingRight: 8, paddingLeft: 8, color: theme.primary
		},
		$flat$large: { paddingLeft: 12, paddingRight: 12 },
		$flat$inverse: { color: theme.onPrimary },

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
	name: 'cxl-card',
	styles: { $: {
		elevation: 1, borderRadius: 2, backgroundColor: theme.surface,
		color: theme.onSurface
	} }
});

component({
	name: 'cxl-checkbox',
	template: `
<span &=".focusCircle .focusCirclePrimary"></span>
<cxl-icon icon="check" &=".box"></cxl-icon>
<span &="content"></span>
	`,
	events: [ 'change' ],
	bindings: 'action:#toggle focusable =checked:#update =false-value:#update =true-value:#update =value:host.trigger(change)',
	styles: [ {
		$: { marginLeft: 16, position: 'relative', display: 'inline-block', cursor: 'pointer', marginBottom: 12 },
		$focus: { outline: 0 },
		box: {
			display: 'inline-block', width: 20, height: 20, border: 2,
			borderColor: theme.onSurface, marginRight: 8,
			borderStyle: 'solid', color: 'rgba(0,0,0,0)', fontSize: 16
		},
		box$checked: {
			borderColor: theme.primary, backgroundColor: theme.primary,
			color: theme.onPrimary
		}
	}, DisabledCSS, FocusCircleCSS ],
	attributes: [ 'checked', 'true-value', 'false-value', 'value', 'disabled', 'touched' ]
}, {
	checked: false,
	'true-value': true,
	'false-value': false,

	update()
	{
		this.value = this[this.checked ? 'true-value' : 'false-value'];
	},

	toggle(ev)
	{
		if (this.disabled)
			return;

		this.checked = !this.checked;
		ev.preventDefault();
	}
});

component({
	name: 'cxl-chip',
	attributes: [ 'removable' ],
	events: [ 'cxl-chip.remove' ],
	template: `
<span &=".avatar content(cxl-avatar)"></span><span &=".content content"></span><cxl-icon &=".remove =removable:show on(click):host.trigger(cxl-chip.remove)" icon="times"></cxl-icon>
	`,
	styles: {
		$: { borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.16)', display: 'inline-flex' },
		content: { display: 'inline-block', marginLeft: 12, paddingRight: 12, lineHeight: 32 },
		avatar: { display: 'inline-block', height: 32 },
		remove: { display: 'inline-block', marginRight: 12, cursor: 'pointer', lineHeight: 32 }
	}
});

component({
	name: 'cxl-col',
	attributes: [ 'grow' ],
	styles: {
		$: { display: 'block', flexShrink: 0 },
		$small: { marginLeft: 16, display: 'inline-block' },
		$large: { marginLeft: 24 },
		$grow: { flexGrow: 1 },
		$firstChild: { marginLeft: 0 }
	}
});

component({
	name: 'cxl-dialog',
	template: '<cxl-backdrop><div &=".content content"></div></cxl-backdrop>',
	styles: {
		content: {
			backgroundColor: theme.surface, position: 'absolute',
			top: 0, left: 0, right: 0, bottom: 0
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
	template: `
<cxl-dialog>
	<cxl-block>
		<cxl-h5 &="=title-text:show:text"></cxl-h5>
		<div &="=message:text"></div>
	</cxl-block>
	<cxl-block compact &=".footer">
		<cxl-button flat &="=action:text action:#remove:#resolve"></cxl-button>
	</cxl-block>
</cxl-dialog>
	`,
	initialize(state) {
		state.$component = this;
		state.promise = new Promise(function(resolve, reject) {
			state.resolve = resolve;
			state.reject = reject;
		});
	}
}, {
	action: 'Ok',
	remove()
	{
		this.$component.remove();
	}
});

component({
	name: 'cxl-dialog-confirm',
	template: `
<cxl-dialog>
	<cxl-block>
		<cxl-h5 &="=title-text:show:text"></cxl-h5>
		<div &="=message:text"></div>
	</cxl-block>
	<cxl-block compact &=".footer">
		<cxl-button flat &="=cancelText:text action:#remove:#reject"></cxl-button>
		<cxl-button flat &="=action:text action:#remove:#resolve"></cxl-button>
	</cxl-block>
</cxl-dialog>
	`,
	extend: 'cxl-dialog-alert'
}, {
	cancelText: 'Cancel',
	action: 'Confirm'
});

component({
	name: 'cxl-drawer',
	template: `
<cxl-backdrop &=".backdrop"></cxl-backdrop>
<div &="on(click):event.stop .drawer content"></div>
	`,
	attributes: [ 'visible', 'right', 'permanent' ],
	styles: {
		drawer: {
			backgroundColor: theme.surface, position: 'absolute', top: 0, left: 0,
			width: '85%', bottom: 0, opacity: 0,
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
	attributes: [ 'disabled', 'touched' ],
	bindings: 'focusable',
	styles: {
		$: {
			elevation: 2, backgroundColor: theme.secondary, color: theme.onSecondary,
			position: 'fixed', width: 56, height: 56, bottom: 16, right: 24,
			borderRadius: 56, textAlign: 'center', paddingTop: 20, cursor: 'pointer',
			fontSize: 20, paddingBottom: 20, lineHeight: 16
		},
		$focus: { elevation: 4 },
		$small: { top: 28, bottom: '' },
		$hover: { elevation: 3 }
	}
});

component({
	name: 'cxl-form',

	events: [ 'submit' ],
	bindings: `
registable.host(cxl-form):=elements

on(cxl-form.submit):#onSubmit:host.trigger(submit)
keypress(enter):#onSubmit:host.trigger(submit)
	`
}, {
	// TODO better focusing
	onSubmit(ev)
	{
		var focus;

		if (this.elements)
		{
			this.elements.forEach(el => {
				if (el.invalid)
					focus = focus || el;

				el.touched = true;
			});

			if (focus)
			{
				focus.focus();
				return cxl.Skip;
			}
		}

		ev.stopPropagation();
	}
});

component({
	name: 'cxl-form-group',
	styles: {
		$: { marginBottom: 16 },
		error: { color: theme.danger, borderColor: theme.danger },
		content: { position: 'relative' },
		labelEmpty$floating: { fontSize: 16, translateY: 24, opacity: 0.75 },
		label: { fontSize: 12, lineHeight: 16, transition: 'transform var(--speed), font-size var(--speed)' }
	},
	attributes: [ 'floating' ],
	template: `
<div &=".label =invalid:.error =isEmpty:.labelEmpty content(cxl-label)"></div>
<div &=".content content =invalid:.error on(change):#onChange"></div>
<cxl-t caption error &="=error:text"></cxl-t>
	`,
	bindings: `on(focusable.touched):#update on(invalid):#update`
}, {
	isEmpty: true,

	onChange(ev)
	{
		this.isEmpty = !ev.target.value;
	},

	update(ev)
	{
		var el = ev.target;

		if (el.touched)
		{
			this.invalid = el.invalid;
			this.error = el.$validity && el.$validity.message;
		}
	}

});

component({
	name: 'cxl-hr',
	styles: { $: {
		border: 0, borderBottom: 1,
		borderColor: '#ccc', borderStyle: 'solid' }
	}
});

component({
	name: 'cxl-icon',
	template: `<span &="=icon:#setIcon"></span>`,
	attributes: [ 'icon' ],
	styles: {
		$: { display: 'inline-block', fontFamily: 'Font Awesome\\ 5 Free' }
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
		}
	}
});

component({
	name: 'cxl-input',
	attributes: [
		'value', 'disabled', 'inverse', 'invalid', 'name', 'touched'
	],
	methods: [ 'focus' ],
	events: [ 'change', 'input', 'blur', 'invalid' ],
	template: `
<input &="id(input) =type:|attribute(type) .input =value:value:host.trigger(change):host.trigger(input) value:=value
	=disabled:attribute(disabled) on(input):event.stop =name:attribute(name)
	on(blur):#onBlur:host.trigger(blur) on(focus):#onFocus" />
<div &=".focusLine =focused:.expand"></div>
	`,
	bindings: `
		registable(cxl-form)
		touchable
		id(component) =invalid:host.trigger(invalid)
	`,
	styles: [ FocusLineCSS, {
		$: { marginBottom: 8 },
		input: {
			fontSize: 16, border: 0, height: 32, backgroundColor: 'transparent',
			width: '100%', paddingTop: 6, paddingBottom: 6, lineHeight: 20,
			borderBottom: 1, borderColor: theme.grayDark, borderStyle: 'solid',
			borderRadius: 0, outline: 0, fontFamily: 'inherit', paddingLeft: 0, paddingRight: 0
		},
		input$focus: { outline: 0, borderColor: theme.primary },
		input$inverse: { borderColor: theme.onPrimary, color: theme.onPrimary },
		input$invalid$touched: { borderColor: theme.danger },
		expand: { scaleX: 1 }
	}, DisabledCSS ]

}, {
	value: '',
	name: null,
	type: 'text',
	invalid: false,

	onFocus()
	{
		this.focused = !this.disabled;
	},

	onBlur()
	{
		this.focused = false;
	},

	focus()
	{
		this.input.focus();
	}
});

component({
	name: 'cxl-item',
	template: `
<a &=".link =href:attribute(href)" tabindex="-1">
	<cxl-icon &="=icon:show:@icon .icon"></cxl-icon>
	<div &=".content content"></div>
</a>
	`,
	events: [ 'action' ],
	bindings: 'focusable action:host.trigger(action)',
	attributes: [ 'href', 'icon', 'selected', 'disabled', 'touched' ],
	styles: [ prefix('link', FocusCSS), {
		$: { cursor: 'pointer', fontSize: 16 },
		'link:focus': { outline: 0 },
		link: {
			color: theme.onSurface, lineHeight: 24, paddingRight: 16, paddingLeft: 16,
			paddingTop: 12, paddingBottom: 12, alignItems: 'center',
			backgroundColor: theme.surface, textDecoration: 'none', display: 'flex'
		},
		content: { flexGrow: 1 },
		icon: { marginRight: 16, width: 28, color: theme.onSurface },
		link$selected: { backgroundColor: theme.primaryLight }
	}, prefix('link', DisabledCSS) ]

});

component({
	name: 'cxl-loading',
	template: `<div style="display:none" &="timer(delay):|show .indicator"></div>`,
	styles: {
		indicator: {
			backgroundColor: theme.primary, height: 4, transformOrigin: 'left', animation: 'wait'
		}
	}
}, {
	delay: 300
});

component({
	name: 'cxl-menu',
	styles: {
		$: {
			elevation: 1, display: 'inline-block', paddingTop: 8, paddingBottom: 8,
			backgroundColor: theme.surface, overflowY: 'auto', color: theme.onSurface
		},
		$dense: { paddingTop: 0, paddingBottom: 0 },
		$closed: { /*scaleX: 0,*/ scaleY: 0 }
	},
	attributes: [ 'closed' ],
	methods: [ 'focus' ],
	bindings: 'id(self) keypress:#onKey:event.prevent'
}, {
	itemSelector: 'cxl-item:not([disabled])',

	focus()
	{
		const item = cxl.dom.find(this.self, this.itemSelector);

		if (item)
			item.focus();
	},

	onKey(ev)
	{
		var el;

		switch (ev.key) {
		case 'ArrowDown':
			if ((el = this.focused && cxl.dom.findNext(this.focused, this.itemSelector)))
				el.focus();
			break;
		case 'ArrowUp':
			if ((el = this.focused && cxl.dom.findPrevious(this.focused, this.itemSelector)))
				el.focus();
			break;
		default:
			return cxl.Skip;
		}
	}
});

component({
	name: 'cxl-menu-toggle',
	attributes: [ 'inverse', 'disabled', 'touched' ],
	template: `
<div &="id(menu) .menu">
<cxl-menu dense closed &=".menuControl action:event.stop:not:=showMenu =showMenu:not:@closed content"></cxl-menu>
</div>
<cxl-icon &=".icon" icon="ellipsis-v"></cxl-icon>
	`,
	bindings: 'id(self) focusable root.on(touchend):#close root.on(click):#close keypress(escape):#close action:#show',
	styles: {
		//$: { position: 'relative' },
		icon: { color: theme.onSurface, cursor: 'pointer', width: 8 },
		icon$inverse: { color: theme.onPrimary },
		menuControl: { transformOrigin: 'right top', textAlign: 'left' },
		menu: {
			position: 'absolute', left: 0, right: 0, height: 0, textAlign: 'right', elevation: 5
		}
	}
}, {
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
		//this.menu.style.top = el.offsetTop+'px';

		const item = cxl.dom.find(this.self, this.itemSelector);

		if (item)
			item.focus();
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
		style.innerHTML = 'body{padding:0;margin:0;}';
		document.head.appendChild(style);
	}
});

component({
	name: 'cxl-navbar',
	attributes: [ 'permanent' ],
	template: `
<cxl-drawer &="action:#onRoute =permanent:@permanent =visible:@visible content location:#onRoute"></cxl-drawer>
<cxl-icon &="action:#toggle .toggler" icon="bars"></cxl-icon>
	`,
	styles: {
		$: { display: 'inline-block', color: theme.onSurface, fontSize: 16 },
		toggler: {
			fontSize: 18, width: 16, marginRight: 32,
			color: theme.onPrimary, cursor: 'pointer', display: 'inline-block'
		},
		toggler$permanent$large: { display: 'none' }
	}
}, {

	visible: false,
	toggle() { this.visible = !this.visible; },

	onRoute()
	{
		this.visible=false;
	}

});

component({
	name: 'cxl-option',
	attributes: [ 'value', 'selected' ],
	events: [ 'action', 'change' ],
	bindings: 'selectable action:host.trigger(action) =value:host.trigger(change)',
	styles: {
		$: {
			cursor: 'pointer', color: theme.onSurface, lineHeight: 48, paddingRight: 16,
			paddingLeft: 16, backgroundColor: theme.surface
		},
		$selected: { backgroundColor: theme.primaryLight }
	}
}, {
	value: null
});

component({
	name: 'cxl-t',
	styles: {
		$: { fontWeight: 400, fontSize: 16, marginBottom: 8 },
		$lastChild: { marginBottom: 0 },

		$caption: { fontSize: 12 },
		$h1: { fontWeight: 200, fontSize: 96, marginBottom: 64 },
		$h2: { fontWeight: 200, fontSize: 60, marginBottom: 48 },
		$h3: { fontSize: 48, marginBottom: 32 },
		$h4: { fontSize: 34, marginBottom: 24 },
		$h5: { fontSize: 24, marginBottom: 16 },
		$h6: { fontSize: 20, fontWeight: 500, marginBottom: 16 },
		$subtitle: { fontSize: 16, lineHeight: 22, marginBottom: 0 },
		$subtitle2: { fontSize: 14, lineHeight: 18 },

		$primary: { color: theme.primary },
		$secondary: { color: theme.secondary },
		$error: { color: theme.danger },
		$input: { marginBottom: 8, paddingTop: 6, paddingBottom: 6, lineHeight: 20 }
	}
});

component({
	name: 'cxl-password',
	extend: 'cxl-input'
}, {
	type: 'password'
});

component({
	name: 'cxl-progress',
	events: [ 'change' ],
	attributes: [ 'value' ],
	template: `
<div &=".indicator =value:host.trigger(change):#setValue:.indeterminate"></div>
	`,
	styles: {
		$: { backgroundColor: theme.primaryLight, height: 4 },
		indicator: { backgroundColor: theme.primary, height: 4, transformOrigin: 'left' },
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

const radioValues = [];

component({
	name: 'cxl-radio',
	template: `
<x &=".focusCircle .focusCirclePrimary"></x>
<cxl-icon icon="circle" &=".box"></cxl-icon>
<span &=".content content"></span>
	`,
	events: [ 'change' ],
	bindings: 'id(host) action:#toggle focusable =name:#register =checked:host.trigger(change) =value:host.trigger(change)',
	styles: [{

		$: { position: 'relative', cursor: 'pointer', marginBottom: 12 },
		content: { marginLeft: 36 },
		box: {
			position: 'absolute', border: 2, width: 20, display: 'inline-block',
			borderColor: theme.onSurface, marginRight: 8, borderRadius: 10,
			borderStyle: 'solid', color: 'rgba(0,0,0,0)', fontSize: 12,
			lineHeight: 16, textAlign: 'center'
		},
		box$checked: { borderColor: theme.primary, color: theme.primary }

	}, DisabledCSS, FocusCircleCSS ],
	attributes: [ 'checked', 'value', 'disabled', 'name', 'touched' ],

	connect(state)
	{
		if (this.name)
			state.register(this.name);
	},

	disconnect(state)
	{
		var i = radioValues.indexOf(this);

		if (i!==-1)
			radioValues.splice(i, 1);

		state.registered = false;
	}
}, {
	checked: false,

	register(name)
	{
		if (name && !this.registered)
		{
			radioValues.push(this.host);
			this.registered = true;
		}
	},

	update()
	{
		if (this.name)
		{
			radioValues.forEach(r => {
				if (r.name===this.name && r !== this.host)
					r.checked = false;
			});
		}
	},

	toggle()
	{
		if (this.disabled)
			return;

		if (!this.checked)
		{
			this.checked = true;
			this.update();
		}
	}
});

component({
	name: 'cxl-search-input',
	events: [ 'change' ],
	attributes: [ 'value' ],
	template: `
<cxl-icon icon="search" &=".icon"></cxl-icon>
<input &="value:=value =value:host.trigger(change) .input" placeholder="Search"></input>
	`,
	styles: {
		$: { elevation: 1, position: 'relative', padding: 16, paddingBottom: 14, fontSize: 18 },
		icon: { position: 'absolute', top: 18, color: theme.grayLighter },
		input: {
			outline: 0, border: 0, width: '100%',
			lineHeight: 24, padding: 0, paddingLeft: 48, fontSize: 18
		}
	}
});

/*cxl.component({
	name: 'cxl-select-list',
	attributes: [ 'selected', 'value' ],
	bindings: `
		keypress:#onKey:event.prevent
		on(change):event.stop:#onChange
		on(action):event.stop:#onChange
		host.mutation:#onMutation
		=value:#onChange
		connect:#onMutation
	`,
}, {
	value: null,
	selected: null,
	options: null,
	itemSelector: 'cxl-option',

	onChange()
	{
		if (this.selected && this.selected.value===this.value)
			return;

		this.selected = this.options && this.options.find(o => o.value===this.value) || null;
	},

	onMutation(ev, host)
	{
		this.options = cxl.dom.query(host, this.itemSelector);
		this.onChange();
	},

	onKey(ev)
	{
		var el = this.selected;

		switch (ev.key) {
		case 'Enter': case ' ':
			if (this.opened) this.close(); else this.open();
			break;
		case 'Escape':
			this.close();
			break;
		case 'ArrowDown':
			if ((el = el && cxl.dom.findNext(el, this.itemSelector)))
				this.selected = el;
			break;
		case 'ArrowUp':
			if ((el = el && cxl.dom.findPrevious(el, this.itemSelector)))
				this.selected = el;
			break;
		default:
			return cxl.Skip;
		}
	}
});*/

component({
	name: 'cxl-select',
	template: `
<div &=".container =opened:.opened">
	<div &="id(menu) on(action):#close .menu =opened:.menuOpened content"></div>
	<div &="action:#open .selected id(selectedContainer)"></div>
	<cxl-icon &=".icon" icon="caret-down"></cxl-icon>
</div>
<div &=".focusLine"></div>
	`,
	events: [ 'change' ],
	attributes: [ 'disabled', 'value', 'touched' ],
	bindings: `
		focusable
		selectable.host:#onSelected

		id(component)
		=value:host.trigger(change)
		keypress(escape):#close
		on(blur):#close
		action:#open
	`,
	styles: [ FocusLineCSS, {
		$: { cursor: 'pointer' },
		icon: { position: 'absolute', right: 8, top: 8, lineHeight: 16 },
		menu: { position: 'absolute', elevation: 0, right: 0, left: -16, overflowY: 'hidden' },
		menuOpened: { elevation: 3, overflowY: 'auto' },
		selected: { position: 'absolute', left: -16, top: -8, right: 0 },
		container: {
			 overflowY: 'hidden', height: 33, position: 'relative', border: 0,
			 borderBottom: 1, borderStyle: 'solid'
		},
		opened: { overflowY: 'visible' }
	}, DisabledCSS ]

}, {
	selected: null,
	opened: false,
	value: null,

	/**
	 * Calculate the menu dimensions based on content and position.
	 */
	calculateDimensions()
	{
	var
		rootRect = window,
		rect = this.component.getBoundingClientRect(),
		menuRect = this.menu,
		selectedRect = this.selected,
		// Min top is appbar length... safe?
		minTop = 56, //rect.height,
		maxTop = rect.top-minTop,
		maxHeight,
		marginTop = selectedRect ? selectedRect.offsetTop : 0,
		scrollTop = 0, height,
		menuStyle = this.menu.style
	;
		if (marginTop > maxTop)
		{
			scrollTop = marginTop-maxTop;
			marginTop = maxTop;
		}

		menuStyle.transform = 'translateY(' + (-marginTop-8) + 'px)';

		height = menuRect.scrollHeight-scrollTop;
		maxHeight = rootRect.clientHeight - rect.clientBottom + marginTop;

		if (height > maxHeight)
			height = maxHeight;
		else if (height < minTop)
			height = minTop;

		menuStyle.height = height+'px';
		menuRect.scrollTop = scrollTop;
	},

	open()
	{
		if (this.disabled)
			return;

		this.opened = true;
		this.calculateDimensions();
	},

	close()
	{
		this.opened = false;
	},

	placeholder: '(Select an option)',

	getPlaceholder()
	{
		if (!this.placeholderEl)
		{
			const el = this.placeholderEl = cxl.dom('cxl-option');
			cxl.dom.setContent(el, this.placeholder);
		}

		return this.placeholderEl;
	},

	onSelected(selected)
	{
		if (selected)
		{
			if (this.value !== selected.value)
				this.value = selected.value;

			// TODO Find a better way
			const clone = selected.cloneNode(true);
			clone.selected = false;
			cxl.dom.setContent(this.selectedContainer, clone);
		} else if (this.value===null || this.value===undefined)
			cxl.dom.setContent(this.selectedContainer, this.getPlaceholder());

		this.selected = selected;
		this.calculateDimensions();
	},

	onAction()
	{
		if (this.disabled)
			return;

		this.close();
	}

});

component({
	name: 'cxl-slider',
	events: [ 'change' ],
	attributes: [ 'value', 'disabled', 'step', 'touched' ],
	bindings: 'focusable keypress(arrowleft):#onLeft keypress(arrowright):#onRight drag.x:#onDrag =value:host.trigger(change)',
	template: `
<div &=".background =disabled:.disabled"><div &=".line =value:#update">
<x &=".focusCircle .focusCirclePrimary"></x>
<div &=".knob"></div>
</div></div>
	`,
	styles: [{
		$: { paddingTop: 15, paddingBottom: 15, userSelect: 'none' },
		knob: {
			backgroundColor: theme.primary, width: 12, height: 12, display: 'inline-block',
			borderRadius: 6, translateY: -5
		},
		focusCircle: { marginLeft: -4, marginTop: -8 },
		background: { backgroundColor: theme.primary },
		line: { backgroundColor: theme.primaryLight, height: 2 }
	}, DisabledCSS, FocusCircleCSS ]
}, {
	value: 0,
	step: 0.05,

	onLeft() { this.value -= this.step; },

	onRight() { this.value += this.step; },

	update(value, el)
	{
		if (value < 0)
			value = 0;
		else if (value > 1)
			value = 1;

		el.style.marginLeft = value*100 + '%';

		return (this.value = value);
	},

	onDrag(x)
	{
		if (this.disabled)
			return;

		this.value = x;
	}

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

	connect()
	{
		// TODO better way to animate?
		setTimeout(() => {
			this.style.opacity = 1;
			this.style.transform = 'scale(1,1)';
		}, 50);
	}
}, {
	delay: 4000
});

component({
	name: 'cxl-snackbar-container',

	styles: {
		$: { position: 'fixed', left: 16, bottom: 16, right: 16, textAlign: 'center' },
		$left: { textAlign: 'left' },
		$right: { textAlign: 'right' }
	},

	connect()
	{
		ui.snackbarContainer = this;
	},

	initialize(state)
	{
		state.host = this;
		state.queue = [];
	},

	methods: [ 'notify' ]

}, {

	queue: null,

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

component({
	name: 'cxl-submit',
	extend: 'cxl-button',
	template: '<cxl-icon &="=submitting:show =icon:@icon"></cxl-icon>' +
		' <span &="content"></span>',
	events: [ 'cxl-form.submit' ],
	bindings: 'action:host.trigger(cxl-form.submit) =submitting:=disabled'
}, {
	primary: true,
	submitting: false,
	icon: 'spinner'
});

component({
	name: 'cxl-switch',
	template: `
<span &=".background =checked:#update"></span>
<div &=".knob">
<x &=".focusCircle"></x>
</div>
	`,
	attributes: [ 'checked', 'true-value', 'false-value', 'value', 'disabled', 'touched' ],
	events: [ 'change' ],
	bindings: 'focusable =value:host.trigger(change) action:#onClick:host.trigger(change)',
	styles: [{
		$: {
			position: 'relative', display: 'inline-block', width: 46, height: 20,
			cursor: 'pointer', userSelect: 'none'
		},
		background: {
			position: 'absolute',
			display: 'block', left: 10, top: 2,
			height: 16,
			borderRadius: 8,
			width: 26,
			backgroundColor: 'rgba(0,0,0,0.26)'
		},

		knob: {
			width: 20, height: 20,
			borderRadius: 10,
			backgroundColor: '#fff',
			position: 'absolute',
			elevation: 1
		},

		background$checked: { backgroundColor: theme.primaryLight },
		knob$checked: { translateX: 24, backgroundColor: theme.primary },
		focusCircle$checked: { backgroundColor: theme.primary }
	}, FocusCircleCSS, DisabledCSS ]
}, {
	'true-value': true,
	'false-value': false,
	'checked': false,

	update()
	{
		this.value = this[this.checked ? 'true-value' : 'false-value'];
	},

	onClick()
	{
		this.checked = !this.checked;
	}
});

component({
	name: 'cxl-tab',
	template: '<a &=".link =href:@href content"></a>',
	attributes: ['href', 'selected'],
	styles: {
		$: { flexShrink: 0 },
		$small: { display: 'inline-block' },
		link: {
			padding: 16, paddingBottom: 12, border: 0, borderBottom: 4, borderColor: 'transparent',
			textTransform: 'uppercase', fontSize: 14, color: theme.onPrimary, lineHeight: 20,
			textDecoration: 'none', borderStyle: 'solid', textAlign: 'center', display: 'block'
		},
		link$selected: { borderColor: theme.secondary }
	}
});

component({
	name: 'cxl-tabs',
	styles: {
		$: {
			backgroundColor: theme.primary, color: theme.onPrimary,
			border: 0, display: 'flex', overflowX: 'auto', flexShrink: 0
		},
		$small: { display: 'block' }
	}
});

component({
	name: 'cxl-textarea',
	template: `
<div &="id(span) .input .measure"></div>
<textarea &="id(textarea) .input .textarea =value::value =value:#calculateHeight:host.trigger(change)
	=disabled:attribute(disabled) on(focus):bool:=focused on(blur):not:=focused =focused:.focused"></textarea>`,
	attributes: [ 'value', 'disabled' ],
	events: [ 'change' ],
	styles: {
		$: {
			marginBottom: 8, marginTop: 8, position: 'relative'
		},
		input: {
			fontSize: 16, border: 1, backgroundColor: 'transparent', padding: 16,
			lineHeight: 20, fontFamily: 'inherit', borderColor: theme.grayDark,
			borderStyle: 'solid'
		},
		textarea: {
			width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
			height: '100%', outline: 0, borderRadius: 0
		},
		focused: { borderColor: theme.primary },
		//input$hover: { borderBottom: 2, borderStyle: 'solid' },
		inverse: { borderColor: theme.white, color: theme.white },
		inverse$focus: { borderColor: theme.primary },
		readonly: { borderStyle: 'dashed' },
		invalid: { borderColor: theme.danger },
		invalid$focus: { borderColor: theme.danger },
		// TODO move to textarea when inheritance works
		measure: { opacity: 0, whiteSpace: 'pre-wrap' }
	},

	initialize(state)
	{
		var initial = this.innerHTML;

		if (initial)
			state.value = initial;
	}

}, {
	value: '',

	calculateHeight()
	{
		this.span.innerHTML = this.textarea.value + '&nbsp;';
	}
});

// TODO Optimize this
class ElementValidation
{
	constructor(el)
	{
		if (el.$validity)
			return el.$validity;

		this.$element = el;
		this.$validators = [];
		el.$validity = this;
	}

	$findInvalid()
	{
		return this.$validators.find(v => v.value);
	}

	trigger()
	{
		this.$element.invalid = !!this.$findInvalid();
		//cxl.dom.trigger(this.$element, 'validity', this);
	}

	register(validator)
	{
		const v = this.$validators;
		v.push(validator);
		return () => v.splice(v.indexOf(validator), 1);
	}

	get message()
	{
		var v = this.$findInvalid();

		return v ? v.value : '';
	}

	get valid()
	{
		return !this.$findInvalid();
	}

}

class ValidationDirective extends cxl.Directive {

	initialize()
	{
		// TODO
		const set = this.owner.digest.bind(this.owner);

		this.bindings = [
			new cxl.EventListener(this.element, 'input', set),
			new cxl.EventListener(this.element, 'change', set)
		];

		this.validity = new ElementValidation(this.element);
		this.validity.register(this);
	}

	set(val)
	{
		super.set(val);
		this.validity.trigger();
	}

	digest(state)
	{
		return this.isValid(this.element.value, state);
	}

}

function validate(validator, value)
{
	var valid = validate.Validators[validator](value);

	return valid ? '' : validate.ValidationMessage[validator];
}

directive('valid.equalTo', class ValidEqualTo extends ValidationDirective {

	isValid(val, state)
	{
		var val2 = state[this.parameter];
		return val===val2 ? '' : validate.ValidationMessage.equalTo;
	}

});

directive('valid', class Valid extends ValidationDirective {

	isValid(val)
	{
		return validate(this.parameter, val);
	}

});

cxl.validate = Object.assign(validate, {

	REGEX: {
		ZIPCODE: /^\d{5}(?:[-\s]\d{4})?$/,
		EMAIL: /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
	},

	ElementValidation: ElementValidation,

	ValidationMessage: {
		json: 'Invalid JSON value',
		zipcode: 'Please enter a valid zip code',
		equalTo: 'Values do not match',
		required: 'This field is required',
		email: 'Please enter a valid email address'
	},

	Validators: {

		email(val)
		{
			return val==='' || validate.REGEX.EMAIL.test(val);
		},

		json(value)
		{
			try {
				if (value!=="")
					JSON.parse(value);
			} catch(e) {
				return false;
			}
			return true;
		},

		required(val)
		{
			return val!==null && val!==undefined && val!=='';
		},

		zipcode(value)
		{
			return validate.REGEX.ZIPCODE.test(value);
		}

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
	}

});

})(this.cxl);