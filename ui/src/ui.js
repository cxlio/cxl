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
		focusCirclePrimary: { backgroundColor: 'primary' },
		focusCircle$hover: { scaleX: 1, scaleY: 1, translateX: -14, translateY: -14, opacity: 0.14 },
		focusCircle$focus: { scaleX: 1, scaleY: 1, translateX: -14, translateY: -14, opacity: 0.25 },
		focusCircle$disabled: { scaleX: 0, scaleY: 0 }
	},

	FocusLineCSS = {
		$focus: { outline: 0 },
		focusLine: {
			position: 'relative', border: 0, borderTop: 2, borderStyle: 'solid',
			borderColor: 'primary', scaleX: 0, top: -1
		},
		focusLine$invalid$touched: { borderColor: 'error' },
		focusLine$inverse: { borderColor: 'secondary' },
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

behavior('focusable', `
	@disabled:aria.prop(disabled):not:focus.enable touchable
`);
behavior('touchable', `
	on(blur):event.stop:bool:@touched
	@touched:host.trigger(focusable.touched)
`);
behavior('selectable', `
	connect:host.trigger(selectable.register)
	disconnect:host.trigger(selectable.unregister)
	action:host.trigger(selectable.action)
	@selected:aria.prop(selected)
`);
behavior('selectable.host', {
	bindings: `
id(host)
on.message(selectable.register):#register:=event
on.message(selectable.unregister):#unregister:=event
=event:#onChange

on(change):#onChangeEvent
on(selectable.action):#onAction
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
			this.event =ev;
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

directive('aria.prop', {

	initialize()
	{
		// TODO keep here?
		const states = this.element.$view.$ariaStates || (this.element.$view.$ariaStates = []);
		states.push('aria-' + this.parameter);
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
	attributes: [ 'extended', 'fixed' ],
	bindings: 'role(heading)',
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
	name: 'cxl-button',
	attributes: [ 'disabled', 'primary', 'flat', 'secondary', 'inverse', 'touched', 'big' ],
	bindings: 'focusable role(button) action:#onAction',
	styles: [FocusCSS, {
		$: {
			elevation: 1, paddingTop: 8, paddingBottom: 8, paddingRight: 16,
			paddingLeft: 16, cursor: 'pointer', display: 'inline-block',
			font: 'button', borderRadius: 2, userSelect: 'none',
			backgroundColor: 'surface', color: 'onSurface', textAlign: 'center'
		},

		$big: { padding: 16, fontSize: 22 },
		$flat: {
			backgroundColor: 'surface',
			elevation: 0, fontWeight: 500, paddingRight: 8, paddingLeft: 8, color: 'link'
		},
		$flat$large: { paddingLeft: 12, paddingRight: 12 },
		$flat$inverse: { backgroundColor: 'primary', color: 'onPrimary' },

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
	}, {}, {}, {}, {}, {} ])
});

component({
	name: 'cxl-card',
	styles: { $: {
		elevation: 1, borderRadius: 2, backgroundColor: 'surface',
		color: 'onSurface'
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
	bindings: `
focusable role(checkbox)
action:#toggle
=value:#onValue:host.trigger(change)
=checked:#update:aria.prop(checked) =false-value:#update =true-value:#update
	`,
	styles: [ {
		$: { marginLeft: 16, position: 'relative', display: 'inline-block', cursor: 'pointer', marginBottom: 12 },
		$focus: { outline: 0 },
		box: {
			display: 'inline-block', width: 20, height: 20, border: 2,
			borderColor: 'onSurface', marginRight: 8,
			borderStyle: 'solid', color: 'rgba(0,0,0,0)', fontSize: 16
		},
		box$checked: {
			borderColor: 'primary', backgroundColor: 'primary',
			color: 'onPrimary'
		}
	}, DisabledCSS, FocusCircleCSS ],
	attributes: [ 'checked', 'true-value', 'false-value', 'value', 'disabled', 'touched' ]
}, {
	value: cxl.Undefined,
	checked: false,
	'true-value': true,
	'false-value': false,

	onValue(val)
	{
		this.checked = val===this['true-value'];
	},

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
	attributes: [ 'removable', 'disabled', 'touched', 'primary', 'secondary' ],
	events: [ 'cxl-chip.remove' ],
	bindings: 'focusable keypress:#onKey',
	template: `
<span &=".avatar content(cxl-avatar)"></span><span &=".content content"></span><cxl-icon &=".remove =removable:show on(click):host.trigger(cxl-chip.remove)" icon="times"></cxl-icon>
	`,
	styles: [{
		$: {
			borderRadius: 16, fontSize: 14, backgroundColor: 'divider',
			display: 'inline-flex', color: 'onSurface'
		},
		$primary: { color: 'onPrimary', backgroundColor: 'primary' },
		$secondary: { color: 'onSecondary', backgroundColor: 'secondary' },
		content: { display: 'inline-block', marginLeft: 12, paddingRight: 12, lineHeight: 32 },
		avatar: { display: 'inline-block', height: 32 },
		remove: { display: 'inline-block', marginRight: 12, cursor: 'pointer', lineHeight: 32 }
	}, FocusCSS ]
}, {
	onKey(ev, el)
	{
		if (this.removable && (ev.key==='Delete' || ev.key==='Backspace'))
			cxl.dom.trigger(el, 'cxl-chip.remove');
	}
});

component({
	name: 'cxl-dialog',
	template: '<cxl-backdrop><div &=".content content"></div></cxl-backdrop>',
	bindings: 'role(dialog)',
	styles: {
		content: {
			backgroundColor: 'surface', position: 'absolute',
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
	attributes: [ 'disabled', 'touched', 'static' ],
	bindings: 'focusable',
	styles: {
		$: {
			elevation: 2, backgroundColor: 'secondary', color: 'onSecondary',
			position: 'fixed', width: 56, height: 56, bottom: 16, right: 24,
			borderRadius: 56, textAlign: 'center', paddingTop: 20, cursor: 'pointer',
			fontSize: 20, paddingBottom: 20, lineHeight: 16
		},
		$static: { position: 'static' },
		$focus: { elevation: 4 },
		$small: { top: 28, bottom: '' },
		$hover: { elevation: 3 }
	}
});

component({
	name: 'cxl-form',
	events: [ 'submit' ],
	bindings: `
role(form)
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
		error: { color: 'error', borderColor: 'error' },
		content: { position: 'relative' },
		labelEmpty$floating: { fontSize: 16, translateY: 24, opacity: 0.75 },
		label: {
			fontSize: 12, lineHeight: 16,
			transition: 'transform var(--cxl-speed), font-size var(--cxl-speed)'
		}
	},
	attributes: [ 'floating' ],
	template: `
<div &=".label =invalid:.error =isEmpty:.labelEmpty content(cxl-label):#onLabel"></div>
<div &=".content content =invalid:.error on(change):#onChange"></div>
<cxl-t caption &=".error =error:text"></cxl-t>
	`,
	bindings: `
on(cxl-form.register):#onChange on(focusable.touched):#update on(invalid):#update
	`
}, {
	isEmpty: true,

	onLabel(label)
	{
		this.labelEl = label;
	},

	onChange(ev)
	{
		this.inputEl = ev.target;

		if (this.labelEl)
			this.inputEl['aria-label'] = this.labelEl.innerText;

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
	name: 'cxl-grid',
	attributes: [ 'rows', 'columns', 'gap' ],
	bindings: `
=rows:style.inline(gridTemplateRows)
=columns:#setColumns
=gap:style.inline(gridGap)
	`,
	styles: {
		$: { display: 'grid' }
	}
}, {
	// TODO
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
	template: `<span &="=icon:#setIcon"></span>`,
	bindings: 'role(img) #getAlt:attribute(alt)',
	attributes: [ 'icon', 'alt' ],
	styles: {
		$: { display: 'inline-block', fontFamily: 'Font Awesome\\ 5 Free' }
	}
}, {
	alt: '',
	getAlt()
	{
		return this.alt || this.icon || '';
	},

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
		'value', 'disabled', 'inverse', 'invalid', 'name', 'touched', 'maxlength', 'aria-label'
	],
	methods: [ 'focus' ],
	events: [ 'change', 'input', 'blur', 'invalid' ],
	template: `
<input &="id(input) =type:|attribute(type) .input
	=aria-label:attribute(aria-label)
	=value:value:host.trigger(change):host.trigger(input)
	=maxlength:filter:@maxLength value:=value
	=disabled:attribute(disabled) on(input):event.stop =name:attribute(name)
	on(blur):#onBlur:host.trigger(blur) on(focus):#onFocus" />
<div &=".focusLine =focused:.expand"></div>
	`,
	bindings: `
id(component)
role(textbox)
registable(cxl-form)
touchable
=invalid:aria.prop(invalid):host.trigger(invalid)
	`,
	styles: [ FocusLineCSS, {
		$: { marginBottom: 8 },
		input: {
			fontSize: 16, border: 0, height: 32, backgroundColor: 'transparent',
			color: 'onSurface', width: '100%', paddingTop: 6, paddingBottom: 6, lineHeight: 20,
			borderBottom: 1, borderColor: 'onSurface', borderStyle: 'solid',
			borderRadius: 0, outline: 0, fontFamily: 'inherit', paddingLeft: 0, paddingRight: 0
		},
		input$focus: { outline: 0, borderColor: 'primary' },
		input$inverse: { borderColor: 'onPrimary', color: 'onPrimary' },
		input$invalid$touched: { borderColor: 'error' },
		expand: { scaleX: 1 }
	}, DisabledCSS ]

}, {
	value: '',
	focused: false,
	name: null,
	type: 'text',
	invalid: false,
	maxlength: null,

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
	name: 'cxl-input-icon',
	styles: {
		$: { position: 'absolute', top: 8, right: 0 }
	}
});

component({
	name: 'cxl-calendar-date',
	attributes: [ 'touched', 'value', 'selected', 'disabled' ],
	bindings: 'focusable',
	template: `
<span &="=value:#getDate:text"></span>
	`,
	styles: [ FocusCSS, DisabledCSS, {
		$: {
			borderRadius: 40, width: 40, height: 40, lineHeight: 40, display: 'inline-block',
			textAlign: 'center', padding: 0, backgroundColor: 'surface', color: 'onSurface',
			cursor: 'pointer'
		},
		$selected: {
			backgroundColor: 'primary', color: 'onPrimary'
		}
	}]
}, {
	getDate(val) {
		return val && val.getDate();
	}
});

component({
	name: 'cxl-calendar-month',
	attributes: [ 'value', 'month' ],
	template: `
<cxl-table &="action:#onAction">
	<cxl-th>S</cxl-th>
	<cxl-th>M</cxl-th>
	<cxl-th>T</cxl-th>
	<cxl-th>W</cxl-th>
	<cxl-th>T</cxl-th>
	<cxl-th>F</cxl-th>
	<cxl-th>S</cxl-th>

	<template &="=dates:each:repeat">
	<cxl-td><cxl-calendar-date &="$date:@value $disabled:@disabled $today:.today"></cxl-calendar-date></cxl-td>
	</template>
</cxl-table>
	`,
	bindings: `=month:#render =value:#parse`,
	styles: {
		$: { textAlign: 'center' },
		today: { border: 1, borderStyle: 'solid', borderColor: 'primary' }
	},
	initialize(state)
	{
		const now = new Date();
		state.today = (new Date(now.getFullYear(), now.getMonth(), now.getDate())).getTime();
		state.month = state.month || now;
	}

}, {
	selected: null,
	value: null,

	parse(val)
	{
		if (val && !(val instanceof Date))
			this.value = new Date(val);
	},

	setSelected(el)
	{
		if (this.selected)
			this.selected.selected = false;

		el.selected = true;
		this.selected = el;
		this.value = el.value;
	},

	onAction(ev)
	{
		const el = ev.target;

		if (el.tagName==='CXL-CALENDAR-DATE' && !el.disabled)
			this.setSelected(el);

		ev.stopPropagation();
	},

	getFirstDate(date)
	{
		const result = new Date(date.getFullYear(), date.getMonth(), 1);
		result.setDate(1-result.getDay());
		return result;
	},

	getLastDate(date)
	{
		const result = new Date(date.getFullYear(), date.getMonth()+1, 1);
		result.setDate(7 - result.getDay());
		return result;
	},

	createItem(current)
	{
		return {
			date: new Date(current),
			disabled: current.getMonth() !== this.month,
			today: this.today === current.getTime()
		};
	},

	render(startDate)
	{
	const
		dates = this.dates = [],
		lastDate = this.getLastDate(startDate)
	;
		this.month = startDate.getMonth();

		var current = this.getFirstDate(startDate);

		do {
			dates.push(this.createItem(current));
			current.setDate(current.getDate() + 1);
		} while (current <= lastDate || dates.length > 50);
	}
});

component({
	name: 'cxl-datepicker',
	events: [ 'change' ],
	attributes: [ 'value' ],
	bindings: '=inputValue:#setCalendarValue =calendarValue:#setInputValue',
	template: `
<cxl-input &="=inputValue:@value on(change):host.trigger(change)"></cxl-input>
<cxl-input-icon>
	<cxl-toggle>
		<cxl-icon icon="calendar"></cxl-icon>
		<cxl-toggle-popup>
	<cxl-card>
<cxl-calendar &="@value:=calendarValue"></cxl-calendar>
	</cxl-card>
		</cxl-toggle-popup>
	</cxl-toggle>
</cxl-input-icon>
	`
}, {
	inputValue: '',

	setCalendarValue(val)
	{
	},

	setInputValue(val)
	{
		this.inputValue = val ? val.toLocaleDateString() : '';
		this.value = val;
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
	bindings: `
focusable role(listitem)
	`,
	attributes: [ 'href', 'icon', 'selected', 'disabled', 'touched' ],
	styles: [ prefix('link', FocusCSS), {
		$: { cursor: 'pointer', fontSize: 16 },
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
			elevation: 1, display: 'inline-block', paddingTop: 8, paddingBottom: 8,
			backgroundColor: 'surface', overflowY: 'auto', color: 'onSurface'
		},
		$dense: { paddingTop: 0, paddingBottom: 0 },
		$closed: { /*scaleX: 0,*/ scaleY: 0 }
	},
	attributes: [ 'closed' ],
	methods: [ 'focus' ],
	bindings: 'id(self) role(list) keypress:#onKey:event.prevent'
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
	name: 'cxl-toggle',
	attributes: [ 'disabled', 'touched' ],
	template: `
<div &="content"></div>
<div &="id(popup) =showMenu:show .popup content(cxl-toggle-popup)"></div>
	`,
	bindings: `
focusable
root.on(touchend):#close root.on(click):#close keypress(escape):#close
action:#show:event.stop
role(button)
	`,
	styles: {
		icon: { color: 'onSurface', cursor: 'pointer', width: 8 },
		popup: { height: 0, elevation: 5, position: 'absolute' }
	}
}, {
	showMenu: false,
	close()
	{
		this.showMenu = false;
	},
	show(ev, el)
	{
		this.showMenu = true;
		this.popup.style.right = 'calc(100% - ' + (el.offsetLeft + el.offsetWidth) + 'px)';
	}
});

component({
	name: 'cxl-menu-toggle',
	attributes: [ 'inverse', 'disabled', 'touched' ],
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
			color: 'onSurface', cursor: 'pointer',
			width: 8
		},
		icon$inverse: { color: 'onPrimary' },
		menuControl: {
			position: 'absolute', transformOrigin: 'right top', textAlign: 'left',
			right: 0
		},
		menu: {
			height: 0, textAlign: 'right', elevation: 5
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
			display: 'inline-block', color: 'onSurface', fontSize: 16,
			marginTop: 8, marginBottom: 8, overflowScrolling: 'touch'
		},
		toggler: {
			fontSize: 18, width: 16, marginRight: 32,
			color: 'onPrimary', cursor: 'pointer', display: 'inline-block'
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
	events: [ 'selectable.action', 'change' ],
	bindings: `
role(option) selectable
=value:host.trigger(change)
	`,
	styles: {
		$: {
			cursor: 'pointer', color: 'onSurface', lineHeight: 20, paddingRight: 16,
			paddingLeft: 16, fontSize: 16, paddingTop: 14, paddingBottom: 14
		},
		$selected: {
			backgroundColor: 'primaryLight', color: 'onPrimaryLight'
		}
	}
}, {
	value: null
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

const radioValues = [];

component({
	name: 'cxl-radio',
	template: `
<x &=".focusCircle .focusCirclePrimary"></x>
<cxl-icon icon="circle" &=".box"></cxl-icon>
<span &=".content content"></span>
	`,
	events: [ 'change' ],
	bindings: `
role(radio) focusable id(host)
action:#toggle
=name:#register
=checked:host.trigger(change):aria.prop(checked)
=value:host.trigger(change)
disconnect:#unregister
	`,
	styles: [{

		$: { position: 'relative', cursor: 'pointer', marginBottom: 12 },
		content: { marginLeft: 36 },
		box: {
			position: 'absolute', border: 2, width: 20, display: 'inline-block',
			borderColor: 'onSurface', marginRight: 8, borderRadius: 10,
			borderStyle: 'solid', color: 'rgba(0,0,0,0)', fontSize: 12,
			lineHeight: 16, textAlign: 'center'
		},
		box$checked: { borderColor: 'primary', color: 'primary' }

	}, DisabledCSS, FocusCircleCSS ],

	attributes: [ 'checked', 'value', 'disabled', 'name', 'touched' ]
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

	unregister()
	{
		var i = radioValues.indexOf(this);

		if (i!==-1)
			radioValues.splice(i, 1);

		this.registered = false;
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
	bindings: 'role(searchbox)',
	template: `
<cxl-icon icon="search" &=".icon"></cxl-icon>
<input &="value:=value =value:host.trigger(change) .input" placeholder="Search"></input>
	`,
	styles: {
		$: { elevation: 1, position: 'relative', padding: 16, paddingBottom: 14, fontSize: 18 },
		icon: { position: 'absolute', top: 18 },
		input: {
			outline: 0, border: 0, width: '100%', backgroundColor: 'surface', color: 'onSurface',
			lineHeight: 24, padding: 0, paddingLeft: 48, fontSize: 18
		}
	}
});

component({
	name: 'cxl-select',
	template: `
<div &=".container =opened:.opened">
	<div &="id(menu) .menu =opened:.menuOpened content"></div>
	<div &="=value:hide .placeholder =placeholder:text"></div>
	<cxl-icon &=".icon" icon="caret-down"></cxl-icon>
</div>
<div &=".focusLine"></div>
	`,
	events: [ 'change' ],
	attributes: [ 'disabled', 'value', 'touched', 'placeholder' ],
	bindings: `
		focusable
		selectable.host:#onSelected

		id(component)
		=value:host.trigger(change)
		keypress(escape):#close
		on(blur):#close
		action:#onAction
	`,
	styles: [ FocusLineCSS, {
		$: { cursor: 'pointer' },
		icon: { position: 'absolute', right: 8, top: 8, lineHeight: 16 },
		menu: { position: 'absolute', elevation: 0, right: 0, left: -16, overflowY: 'hidden' },
		menuOpened: { elevation: 3, overflowY: 'auto', backgroundColor: 'surface' },

		placeholder: {
			color: 'onSurface', lineHeight: 20, paddingRight: 16,
			paddingLeft: 16, fontSize: 16, paddingTop: 14, paddingBottom: 14,
			position: 'absolute', left: -16, top: -8, right: 0, height: 48
		},
		container: {
			 overflowY: 'hidden', height: 33, position: 'relative', border: 0,
			 borderBottom: 1, borderStyle: 'solid'
		},
		opened: { overflowY: 'visible' }
	}, DisabledCSS ]

}, {
	opened: false,
	placeholder: '',
	selected: null,
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
		if (this.opened)
		{
			if (selectedRect)
				selectedRect.selected = true;
		} else if (!selectedRect)
			return (menuStyle.height = 0);
		else
			selectedRect.selected = false;

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
		this.calculateDimensions();
	},

	onSelected(selected)
	{
		if (selected)
		{
			if (this.value !== selected.value)
				this.value = selected.value;
		}

		this.selected = selected;
		this.calculateDimensions();
	},

	onAction()
	{
		if (this.disabled)
			return;

		if (this.opened)
			this.close();
		else
			this.open();
	}

});

component({
	name: 'cxl-slider',
	events: [ 'change' ],
	attributes: [ 'value', 'disabled', 'step', 'touched' ],
	bindings: 'focusable keypress(arrowleft):#onLeft keypress(arrowright):#onRight drag.x:#onDrag =value:host.trigger(change) role(slider)',
	template: `
<div &=".background =disabled:.disabled"><div &=".line =value:#update">
<x &=".focusCircle .focusCirclePrimary"></x>
<div &=".knob"></div></div>
</div>
	`,
	styles: [{
		$: { paddingTop: 15, paddingBottom: 15, userSelect: 'none' },
		knob: {
			backgroundColor: 'primary', width: 12, height: 12, display: 'inline-block',
			borderRadius: 6, translateY: -5
		},
		focusCircle: { marginLeft: -4, marginTop: -8 },
		background: { backgroundColor: 'primaryLight', height: 2 },
		line: { backgroundColor: 'primary', height: 2, textAlign: 'right' }
	}, DisabledCSS, FocusCircleCSS ]
}, {
	value: 0,
	step: 0.05,

	onLeft() { this.value -= +this.step; },

	onRight() { this.value += +this.step; },

	update(value, el)
	{
		if (value < 0)
			value = 0;
		else if (value > 1)
			value = 1;

		el.style.marginRight = (100-value*100) + '%';

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
	name: 'cxl-submit',
	extend: 'cxl-button',
	template: `
<cxl-icon &="=disabled:show =icon:@icon .icon"></cxl-icon>
<span &="content"></span>
	`,
	styles: {
		icon: { animation: 'spin', marginRight: 8 }
	},
	events: [ 'cxl-form.submit' ],
	bindings: 'action:host.trigger(cxl-form.submit)'
}, {
	primary: true,
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
	bindings: `focusable =value:host.trigger(change) action:#onClick role(switch) =checked:aria.prop(checked)`,
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
			backgroundColor: 'divider'
		},

		knob: {
			width: 20, height: 20,
			borderRadius: 10,
			backgroundColor: '#fff',
			position: 'absolute',
			elevation: 1
		},

		background$checked: { backgroundColor: 'primaryLight' },
		knob$checked: { translateX: 24, backgroundColor: 'primary' },
		focusCircle$checked: { backgroundColor: 'primary' }
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
		if (this.disabled)
			return;

		this.checked = !this.checked;
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
		$subtitle: { font: 'subtitle', marginBottom: 0 },
		$subtitle2: { font: 'subtitle2', opacity: 0.73 }
	}
});

component({
	name: 'cxl-tab',
	template: '<a &=".link =href:attribute(href) content"></a>',
	bindings: 'role(tab) focusable =selected:filter:host.trigger(cxl-tab.selected)',
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
	bindings: 'registable.host(table):=event =event:#updateColumns',
	styles: {
		$: { display: 'grid', overflowX: 'auto' }
	}
}, {
	columnCount: 0,
	updateColumns(set, table)
	{
		if (set)
		{
			let columns = '';

			for (let th of set)
				columns += (th.width || 'auto') + ' ';

			this.columnCount = set.size;

			table.style.gridTemplateColumns = columns;
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
			paddingTop: 12, paddingBottom: 12, paddingLeft: 6, paddingRight: 6,
			flexGrow: 1, borderBottom: '1px solid', borderColor: 'divider'
		}
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
		setTimeout(() => {
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

component({
	name: 'cxl-textarea',
	template: `
<div &="id(span) .input .measure"></div>
<textarea &="id(textarea) .input .textarea
	value:=value on(input):event.stop
	=value:value:#calculateHeight:host.trigger(change):host.trigger(input)
	=aria-label:attribute(aria-label)
	=disabled:attribute(disabled)
	on(focus):bool:=focused
	on(change):event.stop
	on(blur):not:=focused =focused:.focused">
</textarea>`,
	bindings: 'role(textbox) =disabled:aria.prop(disabled) aria.prop(multiline)',
	attributes: [ 'value', 'disabled', 'aria-label' ],
	events: [ 'change', 'input' ],
	styles: {
		$: {
			marginBottom: 8, marginTop: 8, position: 'relative'
		},
		input: {
			fontSize: 16, border: 1, backgroundColor: 'transparent', padding: 16,
			lineHeight: 20, fontFamily: 'inherit', borderStyle: 'solid'
		},
		textarea: {
			width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
			height: '100%', outline: 0, borderRadius: 0
		},
		focused: { borderColor: 'primary' },
		//input$hover: { borderBottom: 2, borderStyle: 'solid' },
		inverse: { borderColor: 'onPrimary', color: 'onPrimary' },
		inverse$focus: { borderColor: 'onPrimary' },
		invalid: { borderColor: 'error' },
		invalid$focus: { borderColor: 'error' },
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