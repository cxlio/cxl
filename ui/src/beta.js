(cxl=>{
"use strict";

const
	component = cxl.component,
	theme = cxl.ui.theme,
	directive = cxl.directive
;

component({
	name: 'cxl-appbar',
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
			backgroundColor: theme.primary, flexShrink: 0,
			fontSize: 18, color: theme.onPrimary, elevation: 2
		},
		$extended: { height: 128 },
		flex$medium: { paddingTop: 8, paddingBottom: 8 }
	}
});

component({
	name: 'cxl-appbar-title',
	attributes: [ 'extended' ],
	styles: {
		$: { flexGrow: 1 },
		$extended: { paddingTop: 92 }
	}
});

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
	name: 'cxl-navbar',
	attributes: [ 'permanent' ],
	template: `
<cxl-drawer &="action:#onRoute =permanent:@permanent =visible:@visible content location:#onRoute"></cxl-drawer>
<cxl-icon &="action:#toggle .toggler" icon="bars"></cxl-icon>
	`,
	styles: {
		$: { display: 'inline-block', color: theme.onSurface, fontSize: 16, marginTop: 8, marginBottom: 8 },
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