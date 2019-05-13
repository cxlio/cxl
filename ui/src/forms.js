(() => {

const
	component = cxl.component,
	radioValues = [],

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

	InputBase = cxl.ui.InputBase = new cxl.ComponentDefinition({
		events: [ 'change', 'input', 'invalid', 'blur', 'focus' ],
		attributes: [ 'value', 'invalid', 'disabled', 'touched', 'focused', 'name' ],
		bindings: `
	registable(form)
	touchable

	=disabled:host.trigger(form.disabled)
	=invalid:aria.prop(invalid):host.trigger(invalid)
	=value:host.trigger(change):host.trigger(input)
	on(focus):#onFocus on(blur):not:=focused
		`
	}, {
		onFocus(ev, el)
		{
			el.focused = !el.disabled;
		}
	})
;

component({
	name: 'cxl-field-toggle',
	attributes: [ 'icon', 'position' ],
	extend: 'cxl-toggle',
	template: `
<span &="=opened:hide .focusCircle .focusCirclePrimary"></span>
<cxl-icon &="=icon:@icon"></cxl-icon>
	`,
	styles: [ FocusCircleCSS, {
		$: {
			paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12, cursor: 'pointer',
			position: 'relative'
		},
		focusCircle: { left: -4 }
	}]
});

component({
	name: 'cxl-checkbox',
	extend: InputBase,
	template: `
<span &=".focusCircle .focusCirclePrimary"></span>
<cxl-icon icon="check" &=".box"></cxl-icon>
<span &="content"></span>
	`,
	bindings: `
role(checkbox)
focusable
action:#toggle
=value:#onValue
=checked:#update:aria.prop(checked)
=false-value:#update
=true-value:#update
	`,
	styles: [ {
		$: {
			marginRight: 16, marginLeft: 0, position: 'relative', cursor: 'pointer',
			paddingTop: 12, paddingBottom: 12
		},
		$inline: { display: 'inline-block' },
		$invalid: { color: 'error' },
		box: {
			display: 'inline-block', width: 20, height: 20, border: 2,
			borderColor: 'onSurface', marginRight: 8, lineHeight: 16,
			borderStyle: 'solid', color: 'rgba(0,0,0,0)', fontSize: 16
		},
		box$checked: {
			borderColor: 'primary', backgroundColor: 'primary', color: 'onPrimary'
		},
		box$invalid$touched: { borderColor: 'error' }
	}, FocusCircleCSS ],
	attributes: [ 'checked', 'true-value', 'false-value', 'inline' ]
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
	name: 'cxl-field-help',
	attributes: [ 'invalid' ],
	styles: {
		$: { lineHeight: 12, verticalAlign: 'bottom', fontSize: 12, paddingTop: 8 },
		$invalid: { color: 'error' }
	}
});

component({
	name: 'cxl-field-base',
	attributes: [ 'outline', 'floating', 'invalid', 'focused', 'leading', 'disabled', 'hovered' ],
	template: `
<div &=".mask"></div>
<div &=".label content(cxl-label-slot)"></div>
<div &=".content content(cxl-field-content)"></div>
<slot &="content"></slot>
	`,
	styles: {
		$: {
			position: 'relative',
			paddingLeft: 12, paddingRight: 12, paddingTop: 24, paddingBottom: 10,
			backgroundColor: 'surface', color: 'onSurface', fontSize: 0
		},
		$focused: { borderColor: 'primary', color: 'primary' },
		$outline: {
			borderColor: 'onSurface', borderWidth: 1, borderStyle: 'solid',
			borderRadius: 4, marginTop: 8, paddingTop: 16, paddingBottom: 16,
		},
		$focused$outline: {
			boxShadow: '0 0 0 1px var(--cxl-primary)', borderColor: 'primary'
		},
		$invalid: { color: 'error' },
		$invalid$outline: {
			boxShadow: '0 0 0 1px var(--cxl-error)', borderColor: 'error'
		},
		content: { position: 'relative', fontSize: 16 },
		mask$hover$hovered: {
			position: 'absolute', top: 0, right: 0, left: 0, bottom: 0,
			backgroundColor: 'surface', state: 'hover'
		},
		$disabled: { state: 'disabled' },
		mask$hover$hovered$disabled: { state: 'disabled' },

		// LABEL classes, merged for performance
		label: {
			position: 'absolute', top: 10,
			fontSize: 12, lineHeight: 10, verticalAlign: 'bottom',
			transition: 'transform var(--cxl-speed), font-size var(--cxl-speed)'
		},
		label$focused: { color: 'primary' },
		label$invalid: { color: 'error' },
		label$outline: {
			top: -4, left: 8,
			paddingLeft: 4, paddingRight: 4, marginBottom: 0,
			backgroundColor: 'inherit', display: 'inline-block'
		},
		label$floating: { fontSize: 16, translateY: 21, opacity: 0.75 },
		label$leading: { paddingLeft: 24 },
		label$floating$outline: { translateY: 27 }
	}
});

component({
	name: 'cxl-field',
	attributes: [ 'floating', 'leading', 'outline' ],
	bindings: `
on(form.register):#onRegister
on(focusable.touched):#update
on(invalid):#update
on(input):#onChange
on(form.disabled):#update
on(focus):bool:=focused
on(blur):not:=focused
on(click):#focus
	`,
	template: `
<cxl-field-base &="=focused:@focused =invalid:@invalid =disabled:@disabled =empty:@floating =leading:@leading =outline:@outline" hovered>
	<cxl-label-slot &="content(cxl-label)"></cxl-label-slot>
	<cxl-field-content &="content .flex"></cxl-field-content>
	<cxl-focus-line &=".line =outline:hide =focused:@focused =invalid:@invalid =invalid:@touched"></cxl-focus-line>
</cxl-field-base>
<div &=".help">
	<cxl-field-help invalid &="=error:text:show"></cxl-field-help>
	<div &="=error:hide content(cxl-field-help)"></div>
</div>
	`,
	styles: {
		$: { marginBottom: 16 },
		flex: { display: 'flex' },
		line: { position: 'absolute', marginTop: 7, left: 0, right: 0 },
		help: { paddingLeft: 12, paddingRight: 12 },
		help$leading: { paddingLeft: 38 }
	}
}, {
	floating: false,
	leading: false,
	outline: false,

	onRegister(ev)
	{
		this.inputEl = ev.target;
	},

	onChange(ev)
	{
		this.empty = this.floating && !ev.target.value;
	},

	focus()
	{
		if (this.inputEl)
			this.inputEl.focus();
	},

	update(ev)
	{
		var el = ev.target;

		this.disabled = el.disabled;
		this.focused = el.focused;

		if (el.touched)
		{
			this.invalid = el.invalid;
			this.error = el.$validity && el.$validity.message;
		}
	}
});

component({
	name: 'cxl-form-group',
	extend: 'cxl-field',
	deprecated: true
});

component({
	name: 'cxl-fieldset',
	attributes: [ 'outline' ],
	template: `
<cxl-field-base &="on(invalid):#update =invalid:@invalid =outline:@outline">
	<cxl-label-slot &="content(cxl-label)"></cxl-label-slot>
	<cxl-field-content &="content .content"></cxl-field-content>
</cxl-field-base>
<div &=".help">
	<cxl-field-help invalid &="=error:text:show"></cxl-field-help>
	<div &="=error:hide content(cxl-field-help)"></div>
</div>
	`,
	styles: {
		$: { marginBottom: 16 },
		content: { display: 'block', marginTop: 16 },
		content$outline: { marginTop: 0 }
	}
}, {
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
	name: 'cxl-input',
	extend: InputBase,
	attributes: [ 'maxlength', 'aria-label' ],
	methods: [ 'focus' ],
	template: `
<input &="id(input) =type:|attribute(type) .input
	=aria-label:attribute(aria-label)
	=value:value
	=maxlength:filter:@maxLength value:=value
	=disabled:attribute(disabled) on(input):event.stop =name:attribute(name)
	=autocomplete:attribute(autocomplete)
	on(blur):host.trigger(blur) on(focus):host.trigger(focus)" />
	`,
	bindings: `role(textbox)`,
	styles: {
		$: { flexGrow: 1 },
		input: {
			fontSize: 16, border: 0, height: 22, backgroundColor: 'transparent',
			color: 'onSurface', width: '100%', lineHeight: 20,
			borderRadius: 0, outline: 0, fontFamily: 'inherit', paddingLeft: 0, paddingRight: 0
		},
		input$focus: { outline: 0 }
	}

}, {
	value: '',
	focusline: true,
	focused: false,
	name: null,
	autocomplete: null,
	type: 'text',
	invalid: false,
	maxlength: null,

	focus()
	{
		this.input.focus();
	}
});

component({
	name: 'cxl-password',
	extend: 'cxl-input'
}, {
	type: 'password'
});

component({
	name: 'cxl-focus-line',
	attributes: [ 'focused', 'invalid', 'touched' ],
	template: `<div &=".line"></div`,
	styles: {
		$: {
			position: 'absolute', left: 0, right: 0, height: 2,
			border: 0, borderBottom: 1, borderStyle: 'solid', borderColor: 'onSurface'
		},
		$invalid: { borderColor: 'error' },
		line: {
			backgroundColor: 'primary',
			scaleX: 0, height: 2
		},
		line$focused: { scaleX: 1 },
		line$invalid: { backgroundColor: 'error' },
	}
});

component({
	name: 'cxl-field-icon',
	extend: 'cxl-icon',
	styles: {
		$: { paddingRight: 8, lineHeight: 22, width: 24, textAlign: 'center' },
		$trailing: { paddingRight: 0, paddingLeft: 8 }
	}
});

component({
	name: 'cxl-option',
	attributes: [ 'value', 'selected', 'multiple', 'focused', 'disabled' ],
	events: [ 'selectable.action', 'change' ],
	template: `
<cxl-icon icon="check" &="=multiple:show .box"></cxl-icon>
<div &="content .content"></div>
	`,
	bindings: `
role(option) selectable
=value:host.trigger(change)
	`,
	styles: {
		$: {
			cursor: 'pointer', color: 'onSurface', lineHeight: 20, paddingRight: 16,
			display: 'flex',
			paddingLeft: 16, fontSize: 16, paddingTop: 14, paddingBottom: 14
		},
		box: {
			display: 'inline-block', width: 20, height: 20, border: 2,
			borderColor: 'onSurface', marginRight: 12, lineHeight: 16,
			borderStyle: 'solid', color: 'rgba(0,0,0,0)', fontSize: 16
		},
		box$selected: { borderColor: 'primary', backgroundColor: 'primary', color: 'onPrimary' },
		checkbox: { marginBottom: 0, marginRight: 8 },
		content: { flexGrow: 1 },
		$hover: { filter: 'brightness(0.95)' },
		$selected: { backgroundColor: 'primaryLight', color: 'onPrimaryLight' },
		$focused: { filter: 'brightness(0.85)' },
		$disabled: { state: 'disabled' }
	},
	initialize(state)
	{
		if (!state.value)
			state.value = this.innerText;
	}
}, {
	value: null
});


component({
	name: 'cxl-radio',
	extend: InputBase,
	template: `
<x &=".focusCircle .focusCirclePrimary"></x>
<x &=".box"><x &=".circle"></x></x>
<span &=".content content"></span>
	`,
	bindings: `
role(radio) focusable id(host)
action:#toggle
=name:#register
=checked:host.trigger(change):aria.prop(checked)
disconnect:#unregister
	`,
	styles: [{
		$: {
			position: 'relative', cursor: 'pointer', marginRight: 16, marginLeft: 0,
			paddingTop: 12, paddingBottom: 12
		},
		$inline: { display: 'inline-block' },
		$invalid: { color: 'error' },
		content: { marginLeft: 32, lineHeight: 20 },
		circle: {
			borderRadius: 10, width: 10, height: 10, display: 'inline-block',
			backgroundColor: 'primary', scaleX: 0, scaleY: 0, marginTop: 3
		},
		circle$checked: { scaleX: 1, scaleY: 1 },
		circle$invalid$touched: { backgroundColor: 'error' },
		box: {
			position: 'absolute', border: 2, width: 20, height: 20, display: 'inline-block',
			borderColor: 'onSurface', marginRight: 8, borderRadius: 10,
			borderStyle: 'solid', color: 'primary', lineHeight: 16, textAlign: 'center'
		},
		box$checked: { borderColor: 'primary' },
		box$invalid$touched: { borderColor: 'error' },
		box$checked$invalid$touched: { color: 'error' }

	}, FocusCircleCSS ],

	attributes: [ 'checked' ]
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
				{
					r.checked = false;
					r.touched = true;
				}
			});
		}
	},

	toggle()
	{
		if (this.disabled)
			return;

		if (!this.checked)
		{
			this.checked = this.touched = true;
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
	name: 'cxl-select-menu',
	attributes: [ 'visible' ],
	styles: {
		$: {
			position: 'absolute', elevation: 0, right: -16, left: -16,
			overflowY: 'hidden', transformOrigin: 'top'
		},
		$visible: { elevation: 3, overflowY: 'auto', backgroundColor: 'surface' },
	}
});

component({
	name: 'cxl-select',
	extend: InputBase,
	template: `
<div &=".container =opened:.opened">
	<cxl-select-menu &="id(menu) =menuHeight:style.inline(height)
		=menuTransform:style.inline(transform) =menuScroll:@scrollTop =menuTop:style.inline(top)
		=opened:@visible content"></cxl-select-menu>
	<div &="=value:hide .placeholder =placeholder:text"></div>
	<div &="=value:show:#getSelectedText:text id(selectedText) .selectedText"></div>
	<cxl-icon &=".icon" icon="caret-down" role="presentation"></cxl-icon>
</div>
	`,
	attributes: [ 'placeholder' ],
	bindings: `
		focusable
		selectable.host:#onSelected
		=focusedItem:navigation.select:#onNavigation
		id(component)
		keypress(escape):#close
		on(blur):#close
		root.on(click):#close
		action:#onAction:event.prevent:event.stop
		keypress(enter):event.stop
	`,
	styles: [ {
		$: { cursor: 'pointer', flexGrow: 1, position: 'relative' },
		$focus: { outline: 0 },
		icon: { position: 'absolute', right: 0, top: 0, lineHeight: 20 },
		placeholder: {
			color: 'onSurface', lineHeight: 20, paddingRight: 16,
			paddingLeft: 16, fontSize: 16, paddingTop: 14, paddingBottom: 14,
			position: 'absolute', left: -16, top: -11, right: 0, height: 48
		},
		container: { overflowY: 'hidden', overflowX: 'hidden', height: 22, position: 'relative' },
		opened: { overflowY: 'visible', overflowX: 'visible' }
	} ],

	initialize(state)
	{
		state.calculateDimensions = cxl.debounce(() => {
			state._calculateDimensions();
			this.$view.digest();
		});
	}

}, {
	opened: false,
	placeholder: '',
	selected: null,
	value: null,
	menuScroll: 0,
	menuTop: 0,

	getSelectedText()
	{
		return cxl.Skip;
	},

	updateMenu(selectedRect)
	{
	var
		rootRect = window,
		menuRect = this.menu,
		rect = this.component.getBoundingClientRect(),
		minTop = 56,
		maxTop = rect.top-minTop,
		maxHeight,
		marginTop = selectedRect ? selectedRect.offsetTop : 0,
		scrollTop = 0, height
	;
		if (marginTop > maxTop)
		{
			scrollTop = marginTop-maxTop;
			marginTop = maxTop;
		}

		height = menuRect.scrollHeight-scrollTop;
		maxHeight = rootRect.clientHeight - rect.bottom + marginTop;

		if (height > maxHeight)
			height = maxHeight;
		else if (height < minTop)
			height = minTop;

		this.menuTransform = 'translateY(' + (-marginTop-11) + 'px)';
		this.menuHeight = height + 'px';
		this.menuScroll = scrollTop;
	},

	/**
	 * Calculate the menu dimensions based on content and position.
	 */
	_calculateDimensions()
	{
	const
		selectedRect = this.selected
	;
		if (this.opened)
		{
			if (selectedRect)
				selectedRect.selected = true;
		} else if (!selectedRect)
		{
			this.menuHeight = 0;
			return;
		}
		else
			selectedRect.selected = false;

		this.updateMenu(selectedRect);
	},

	onNavigation(el)
	{
		this.onSelected(el);
	},

	open()
	{
		if (this.disabled || this.opened)
			return;

		this.opened = true;
		this.calculateDimensions();
	},

	close()
	{
		if (this.opened)
		{
			this.opened = false;
			this.calculateDimensions();
		}
	},

	onSelected(selected)
	{
		if (selected)
		{
			if (this.value !== selected.value)
				this.value = selected.value;

			if (this.selected)
				this.selected.selected = false;

			selected.selected = true;
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
	name: 'cxl-field-select',
	template: `
	`
});

component({
	name: 'cxl-multiselect',
	extend: 'cxl-select',
	bindings: 'on(selectable.register):#onRegister root.on(touchend):#close',
	styles: {
		selectedText: {
			color: 'onSurface', lineHeight: 20, paddingRight: 16,
			paddingLeft: 16, fontSize: 16, paddingTop: 14, paddingBottom: 14,
			position: 'absolute', left: -16, top: -11, right: 0, height: 48
		}
	}
}, {
	getSelectedText()
	{
		return this.selected && this.selected.map(s => s.innerText).join(', ');
	},

	_calculateDimensions()
	{
		this.menuTransform = this.opened ? 'scaleY(1)' : 'scaleY(0)';
		this.menuTop = '31px';
	},

	onRegister(ev)
	{
		const el = ev.target;
		// TODO safe?
		el.multiple = true;
	},

	onNavigation(element)
	{
		if (this.focusedItem!==element)
		{
			if (this.focusedItem)
				this.focusedItem.focused = false;

			this.focusedItem = element;
			element.focused = true;
		}
	},

	onSelected(selectedEl)
	{
		if (selectedEl)
		{
			if (!this.selected)
				this.selected = [];

			const selected = this.selected, i = selected.indexOf(selectedEl);

			if (this.focusedItem)
				this.focusedItem.focused = false;

			if (i ===-1)
			{
				selectedEl.selected = true;
				selected.push(selectedEl);
			}
			else
			{
				selectedEl.selected = false;
				selected.splice(i, 1);
			}

			selectedEl.focused = true;
			this.focusedItem = selectedEl;

			if (selected.length===0)
				this.selected = this.value = null;
			else
				this.value = selected.map(o => o.value);
		}

		this.calculateDimensions();
	},

	onAction(ev)
	{
		if (this.disabled)
			return;

	 	if (this.opened)
		{
			if (ev.type==='keyup' && this.focused)
			{
				this.onSelected(this.focusedItem);
				ev.preventDefault();
			}
		} else
		{
			if (this.focusedItem)
			{
				this.focusedItem.focused = false;
				this.focusedItem = null;
			}
			this.open();
		}
	}
});

component({
	name: 'cxl-slider',
	extend: InputBase,
	attributes: [ 'step' ],
	bindings: `
		focusable
		role(slider)
		keypress(arrowleft):#onLeft keypress(arrowright):#onRight
		drag.in(x):#onDrag
	`,
	template: `
<div &=".background">
	<div &=".line =value:#update"><x &=".focusCircle .focusCirclePrimary"></x>
	<div &=".knob"></div>
</div></div>
	`,
	styles: [{
		$: { paddingTop: 15, paddingBottom: 15, userSelect: 'none', position: 'relative', flexGrow: 1 },
		knob: {
			backgroundColor: 'primary', width: 12, height: 12, display: 'inline-block',
			borderRadius: 6, position: 'absolute', top: 10
		},
		focusCircle: { marginLeft: -4, marginTop: -8 },
		background: { backgroundColor: 'primaryLight', height: 2 },
		line: { backgroundColor: 'primary', height: 2, textAlign: 'right' },
		line$invalid$touched: { backgroundColor: 'error' },
		knob$invalid$touched: { backgroundColor: 'error' },
		background$invalid$touched: { backgroundColor: 'error' }
	}, FocusCircleCSS ]
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
	name: 'cxl-switch',
	extend: InputBase,
	template: `
<div &=".content content"></div>
<div &=".switch">
	<span &=".background =checked:#update"></span>
	<div &=".knob"><x &=".focusCircle"></x></div>
</div>
	`,
	attributes: [ 'checked', 'true-value', 'false-value' ],
	bindings: `focusable action:#onClick role(switch) =checked:aria.prop(checked)`,
	styles: [{
		$: {
			display: 'flex', cursor: 'pointer',
			paddingTop: 12, paddingBottom: 12
		},
		content: { flexGrow: 1 },
		switch: {
			position: 'relative', width: 46, height: 20, userSelect: 'none'
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
		knob$invalid$touched: { backgroundColor: 'error' },
		focusCircle$checked: { backgroundColor: 'primary' }
	}, FocusCircleCSS ]
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
	name: 'cxl-textarea',
	extend: InputBase,
	template: `
<div &="id(span) .input .measure"></div>
<textarea &=".input .textarea
	value:=value on(input):event.stop
	=value:value:#calculateHeight
	=aria-label:attribute(aria-label)
	=disabled:attribute(disabled)
	on(change):event.stop
	on(blur):host.trigger(blur) on(focus):host.trigger(focus)">
</textarea>
`,
	bindings: `
role(textbox) touchable aria.prop(multiline) keypress(enter):event.stop
	`,
	attributes: [ 'aria-label' ],
	styles: {
		$: { position: 'relative', flexGrow: 1 },
		input: {
			fontSize: 16, backgroundColor: 'transparent',
			lineHeight: 20, fontFamily: 'inherit', border: 0,
			paddingLeft: 0, paddingRight: 0, paddingTop: 1, paddingBottom: 1
		},
		textarea: {
			width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
			height: '100%', outline: 0, borderRadius: 0,
		},
		measure: { opacity: 0, whiteSpace: 'pre-wrap' }
	}

}, {
	value: '',

	calculateHeight(val)
	{
		this.span.innerHTML = val + '&nbsp;';
	}
});

component({
	name: 'cxl-field-control',
	attributes: [ 'value', 'invalid', 'disabled', 'touched', 'focused', 'name', 'label', 'outline', 'floating' ],
	styles: { $: { display: 'block' } }
});

component({
	name: 'cxl-field-input',
	extend: 'cxl-field-control',
	attributes: [ 'maxlength' ],
	template: `
<cxl-field &="=outline:@outline =floating:@floating">
	<cxl-label &="=label:text"></cxl-label>
	<cxl-input &="=maxlength:@maxlength =value::@value =invalid:@invalid =disabled:@disabled =touched:@touched =focused:@focused =name:@name =label:@aria-label"></cxl-input>
	<div &="content(cxl-field-help)" slot="cxl-field-help"></div>
</cxl-field>
	`
}, {
	value: ''
});

component({
	name: 'cxl-field-password',
	extend: 'cxl-field-input',
	template: `
<cxl-field &="=outline:@outline =floating:@floating">
	<cxl-label &="=label:text"></cxl-label>
	<cxl-password &="=maxlength:@maxlength =value::@value =invalid:@invalid =disabled:@disabled =touched:@touched =focused:@focused =name:@name =label:@aria-label"></cxl-password>
	<div &="content(cxl-field-help)" slot="cxl-field-help"></div>
</cxl-field>
	`
});

component({
	name: 'cxl-field-textarea',
	extend: 'cxl-field-control',
	template: `
<cxl-field &="=outline:@outline =floating:@floating">
	<cxl-label &="=label:show:text"></cxl-label>
	<cxl-textarea &="=value::@value =invalid:@invalid =disabled:@disabled =touched:@touched =focused:@focused =name:@name =label:@aria-label"></cxl-textarea>
	<div &="content(cxl-field-help)" slot="cxl-field-help"></div>
</cxl-field>
	`
}, {
	value: ''
});


component({
	name: 'cxl-form',
	events: [ 'submit' ],
	attributes: [ 'autocomplete', 'elements' ],
	bindings: `
role(form)
registable.host(form):=elements:#buildForm

on(cxl-form.submit):#onSubmit
keypress(enter):#onSubmit
	`,
	template: `
<div &="content"></div>
<form style="display:none;" method="post" &="id(form) on(submit):event.prevent:host.trigger(submit) =autocomplete:@autocomplete">
	<div &="id(inputs)"></div>
	<input &="id(input)" type="submit" />
</form>
	`,
	initialize(state)
	{
		state.id = 'cxl-form-' + (Math.random() * 100 | 0);
	}
}, {
	autocomplete: 'off',

	buildForm(elements)
	{
		if (this.autocomplete !== 'on')
			return;

		const inputs = this.inputs;

		cxl.dom.empty(inputs);

		elements.forEach(el => {
			const i = cxl.dom('input');

			if (el.type==='password')
				i.type = 'password';

			if (el.autocomplete)
				i.autocomplete = el.autocomplete;

			if (el.name)
				i.name = el.name;

			if (el.value)
				i.value = el.value;

			i.addEventListener('change', () => el.value = i.value);
			el.addEventListener('change', () => i.value = el.value);

			inputs.appendChild(i);
		});
	},

	// TODO better focusing
	onSubmit(ev)
	{
		let focus;

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

		this.input.click();
		ev.stopPropagation();
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
	icon: 'spinner',
	submit()
	{
		this.input.click();
	}
});

})();