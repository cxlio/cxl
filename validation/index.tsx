///<amd-module name="@cxl/validation"/>
export type ValidateFunction<T> = (val: T) => string | true;

const EMAIL = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

export const ValidationMessage = {
	json: 'Invalid JSON value',
	zipcode: 'Please enter a valid zip code',
	equalTo: 'Values do not match',
	required: 'This field is required',
	notZero: 'Value cannot be zero',
	email: 'Please enter a valid email address',
};

export function validate(
	el: { setCustomValidity(msg: string): void },
	...validators: ValidateFunction<any>[]
) {
	return (value: any) => {
		let message: string | boolean = true;
		validators.find(validateFn => {
			message = validateFn(value);
			return message !== true;
		});
		el.setCustomValidity(message === true ? '' : (message as any));
	};
}

export function required(val: any) {
	return (
		(val !== null && val !== undefined && val !== '' && val !== false) ||
		ValidationMessage.required
	);
}

export function email(val: string) {
	return val === '' || EMAIL.test(val) || ValidationMessage.email;
}

/*import { get } from '@cxl/component';
import type { InputBase } from './input-base.js';



export function $validate<T extends InputBase>(
	...validators: ValidateFunction<T['value']>[]
) {
	return (el: T) => validate(el, ...validators);
}
*/
