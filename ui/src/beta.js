(cxl=>{
"use strict";

const
	component = cxl.component,
	theme = cxl.ui.theme,
	directive = cxl.directive
;

component({
	name: 'cxl-animate',
	attributes: [ 'pulse', 'spin' ],
	styles: {
		$: { display: 'inline-block' },
		$pulse: { animation: 'pulse' },
		$spin: { animation: 'spin' }
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
	name: 'cxl-c',
	styles: {
		$flex: { display: 'flex' }
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
	name: 'cxl-col',
	attributes: [ 'grow' ],
	styles: {
		$: { display: 'block', flexShrink: 0 },
		$small: { marginLeft: 16, display: 'inline-block' },
		$large: { marginLeft: 24 },
		$grow: { flexGrow: 1, flexShrink: 1 },
		$firstChild: { marginLeft: 0 }
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
	name: 'cxl-grid',
	attributes: [ 'rows', 'columns', 'gap' ],
	bindings: `
=rows:style.inline(gridTemplateRows)
=columns:style.inline(gridTemplateColumns)
=gap:style.inline(gridGap)
	`,
	styles: {
		$: { display: 'grid' }
	}
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
	name: 'cxl-row',
	styles: {
		$: { display: 'flex' }
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
	bindings: 'on(action):host.trigger(cxl-form.submit)'
}, {
	primary: true,
	icon: 'spinner'
});

component({
	name: 'cxl-table'
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

})(this.cxl);