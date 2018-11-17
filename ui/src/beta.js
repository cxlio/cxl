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
	name: 'cxl-layout',
	styles: {
		$: {
			display: 'grid', gridTemplateColumns: 'repeat(12, auto)', gridGap: 16,
			marginLeft: 16, marginRight: 16
		},
		$medium: { gridGap: 24, marginLeft: 24, marginRight: 24 }
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
		const font = cxl.dom('link', {
			rel: 'stylesheet',
			href: 'https://fonts.googleapis.com/css?family=Roboto:300,400,500'
		});
		document.head.appendChild(font);
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
	name: 'cxl-table',
	styles: {
		$: { display: 'grid' }
	}
});

component({
	name: 'cxl-th',
	styles: {
		$: {
			flexGrow: 1, fontSize: 12, color: 'rgba(0,0,0,0.53)',
			padding: 12, borderBottom: '1px solid ' + theme.divider, lineHeight: 24
		}
	}
});

component({
	name: 'cxl-td',
	styles: {
		$: {
			flexGrow: 1, padding: 12, borderBottom: '1px solid ' + theme.divider
		}
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

})(this.cxl);