///<amd-module name="@cxl/ui/input-base.js"/>
import {
	Augment,
	Attribute,
	Component,
	StyleAttribute,
	attributeChanged,
	get,
} from '@cxl/component';
import { merge } from '@cxl/rx';
import { triggerEvent, registable } from '@cxl/template';

@Augment<InputBase>(host =>
	merge(
		attributeChanged(host, 'invalid').pipe(triggerEvent(host, 'invalid')),
		registable(host, 'form'),
		get(host, 'value').tap(val =>
			(host as any).internals?.setFormValue?.(val)
		),
		get(host, 'invalid').tap(val => {
			if (val && !host.validationMessage)
				host.setCustomValidity('Invalid value');
		}),
		attributeChanged(host, 'value').pipe(triggerEvent(host, 'change'))
	)
)
export class InputBase extends Component {
	static formAssociated = true;

	@Attribute()
	value: any;
	@StyleAttribute()
	invalid = false;
	@StyleAttribute()
	disabled = false;
	@StyleAttribute()
	touched = false;
	@Attribute()
	name = '';

	private internals: any;

	constructor() {
		super();
		this.internals = (this as any).attachInternals?.();
	}

	protected formDisabledCallback(disabled: boolean) {
		this.disabled = disabled;
	}

	get validationMessage(): string {
		return this.internals?.validationMessage || '';
	}

	get validity(): ValidityState {
		return this.internals?.validity || null;
	}

	setCustomValidity(msg: string) {
		const invalid = (this.invalid = !!msg);
		this.internals?.setValidity({ customError: invalid }, msg);
	}

	/**
	 * Used by element that do not directly receive focus. ie Input, Textarea
	 */
	focusElement?: HTMLElement;

	focus() {
		if (this.focusElement) this.focusElement.focus();
		else super.focus();
	}
}
