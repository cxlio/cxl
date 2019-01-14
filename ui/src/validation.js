(cxl => {
"use strict";

const
	directive = cxl.directive
;

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
		notZero: 'Value cannot be zero',
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

		notZero(val)
		{
			return val !== 0;
		},

		required(val)
		{
			return val!==null && val!==undefined && val!=='' && val!==false;
		},

		zipcode(value)
		{
			return validate.REGEX.ZIPCODE.test(value);
		}

	}
});

})(this.cxl);