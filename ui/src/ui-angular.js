
const
	core = require('@angular/core'),
	forms = require('@angular/forms')
;

class cxlControl {

	constructor(Renderer2, ElementRef, NgControl, NgModel)
	{
		this._renderer = Renderer2;
		this._elementRef = ElementRef;
		this.el = this._elementRef.nativeElement;

		const ngControl = NgControl;
		const ngModel = NgModel;

		if (ngControl && !ngModel)
			this.setupNgControl(ngControl);

		if (ngModel)
			this.setupNgModel(ngModel);
	}

	onChange() {}
	onTouched() {}

	setupNgControl(ngControl)
	{
		ngControl.valueAccessor = this;
		ngControl.update.subscribe(() => this.set('invalid', ngControl.invalid));
	}

	setupNgModel(ngModel)
	{
		ngModel.valueAccessor = this;
		ngModel.statusChanges.subscribe(() => this.set('invalid', ngModel.invalid));
	}

	set(property, value) { this._renderer.setProperty(this.el, property, value); }

	writeValue(value) { this.set('value', value); }
	registerOnChange(fn) { this.onChange = fn; }
	registerOnTouched(fn) { this.onTouched = fn; }
	setDisabledState(disabled) { this.set('disabled', disabled); }
}

cxlControl.parameters = [
	core.Renderer2,
	core.ElementRef,
	[ { ngMetadataName: 'Optional' }, forms.NgControl],
	[ { ngMetadataName: 'Optional' }, forms.NgModel]
];

core.Directive({
	selector: 'cxl-input, cxl-select',
	host: {'(change)': 'onChange($event.target.value)', '(blur)': 'onTouched()'}
})(cxlControl);

exports.cxlModule = function cxlModule() { };

core.NgModule({
	declarations: [ cxlControl ],
	exports: [ cxlControl ]
})(exports.cxlModule);

