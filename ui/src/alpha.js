(cxl=>{
"use strict";

const
	component = cxl.component,
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
	name: 'cxl-banner',
	template: `
<div></div>
<div></div>
	`
});

component({
	name: 'cxl-block',
	attributes: [
		'inverse', 'compact', 'surface', 'primary', 'secondary', 'flex', 'vflex', 'scroll'
	],
	styles: {
		$: { padding: 16 },
		$compact: { padding: 8 },
		$surface: { backgroundColor: 'surface', color: 'onSurface' },
		$primary: { backgroundColor: 'primary', color: 'onPrimary' },
		$secondary: { backgroundColor: 'secondary', color: 'onSecondary' },

		$inverse: { color: 'onPrimary', backgroundColor: 'primaryDark' },
		$flex: { display: 'flex' },
		$vflex: { display: 'flex', flexDirection: 'vertical' },
		$scroll: { overflowY: 'auto' }
	}
});

component({
	name: 'cxl-content',
	styles: {
		$: { margin: 16, backgroundColor: 'surface', color: 'onSurface' },
		$medium: { margin: 32 },
		$large: { margin: 64 },
		$xlarge: { width: 1200, marginLeft: 'auto', marginRight: 'auto' }
	}
});

component({
	name: 'cxl-layout',
	styles: {
		$: {
			display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridGap: 16,
			padding: 16
		},
		$medium: { gridGap: 24, padding: 24 },
		$large: { width: 1280, margin: 'auto' }
	}
});

component({
	name: 'cxl-loading',
	template: `<div style="display:none" &="timer(delay):|show .indicator"></div>`,
	styles: {
		indicator: {
			backgroundColor: 'primary', height: 4, transformOrigin: 'left', animation: 'wait'
		}
	}
}, {
	delay: 300
});

component({
	name: 'cxl-font',
	attributes: [ 'src' ],
	bindings: '=src:#load'
}, {
	load(src)
	{
		if (this.el)
			cxl.dom.remove(this.el);

		if (!src)
			return;

		const font = this.el = cxl.dom('link', {
			rel: 'stylesheet',
			href: src
		});

		document.head.appendChild(font);
	}
});

component({
	name: 'cxl-google-font',
	attributes: [ 'name', 'weights' ],
	template: `
<cxl-font &="#getUrl:@src"></cxl-font>
	`
}, {
	name: 'Roboto',
	weights: '300,400,500',
	getUrl()
	{
		return '//fonts.googleapis.com/css?family=' + this.name + ':' + this.weights;
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
		const font = cxl.dom('link', {
			rel: 'stylesheet',
			href: 'https://fonts.googleapis.com/css?family=Roboto:300,400,500'
		});
		document.head.appendChild(font);
	}
});

component({
	name: 'cxl-textarea-editable',
	template: `
<div &=".input =disabled:not:@contentEditable content on(input):#onInput =value:text"></div>
	`,

	bindings: 'role(textbox) =disabled:aria.prop(disabled) aria.prop(multiline)',
	attributes: [ 'value', 'disabled' ],
	events: [ 'change' ],
	styles: {
		$: {
			marginBottom: 8, marginTop: 8, position: 'relative'
		},
		input: {
			fontSize: 16, border: 1, backgroundColor: 'transparent', padding: 16,
			lineHeight: 20, fontFamily: 'inherit', borderColor: 'grayDark',
			borderStyle: 'solid'
		}
	}
}, {
	value: '',
	onInput()
	{
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