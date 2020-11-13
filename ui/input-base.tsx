import {
	Augment,
	Attribute,
	Component,
	StyleAttribute,
	attributeChanged,
	bind,
	get,
} from '../component/index.js';
import { merge } from '../rx/index.js';
import { css } from '../css/index.js';
import { triggerEvent } from '../template/index.js';
import { registable } from './core.js';

export const FocusCircleStyle = css({
	focusCircle: {
		position: 'absolute',
		width: 48,
		height: 48,
		backgroundColor: 'elevation',
		borderRadius: 24,
		opacity: 0,
		scaleX: 0,
		scaleY: 0,
		display: 'inline-block',
		translateX: -14,
		translateY: -14,
	},
	focusCirclePrimary: { backgroundColor: 'primary' },
	focusCircle$invalid$touched: { backgroundColor: 'error' },
	focusCircle$hover: {
		scaleX: 1,
		scaleY: 1,
		translateX: -14,
		translateY: -14,
		opacity: 0.14,
	},
	focusCircle$focus: {
		scaleX: 1,
		scaleY: 1,
		translateX: -14,
		translateY: -14,
		opacity: 0.25,
	},
	focusCircle$disabled: { scaleX: 0, scaleY: 0 },
});

export const Undefined = {};

@Augment<InputBase>(
	bind(host =>
		merge(
			attributeChanged(host, 'invalid').pipe(
				triggerEvent(host, 'invalid')
			),
			registable(host, 'form'),
			get(host, 'disabled').tap(val =>
				host.setAttribute('aria-disabled', val ? 'true' : 'false')
			),
			get(host, 'value').tap(val =>
				(host as any).internals?.setFormValue(val)
			),
			get(host, 'invalid').tap(val => {
				if (val && !host.validationMessage)
					host.setCustomValidity('Invalid value');
			}),
			attributeChanged(host, 'value').pipe(triggerEvent(host, 'change'))
		)
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
	name?: string;

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
