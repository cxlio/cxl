import { get } from '../component/index.js';
import type { InputBase } from './form.js';

export type ValidateFunction<T> = (val: T) => string | true;

export function validate<T extends InputBase>(
	el: T,
	...validators: ValidateFunction<T['value']>[]
) {
	return get(el, 'value').tap(value => {
		let message: string | boolean = true;
		validators.find(validateFn => {
			message = validateFn(value);
			return message !== true;
		});
		el.setCustomValidity(message === true ? '' : (message as any));
	});
}

export function $validate<T extends InputBase>(
	...validators: ValidateFunction<T['value']>[]
) {
	return (el: T) => validate(el, ...validators);
}

export const ValidationMessage = {
	json: 'Invalid JSON value',
	zipcode: 'Please enter a valid zip code',
	equalTo: 'Values do not match',
	required: 'This field is required',
	notZero: 'Value cannot be zero',
	email: 'Please enter a valid email address',
};

export function required(val: any) {
	return (
		(val !== null && val !== undefined && val !== '' && val !== false) ||
		ValidationMessage.required
	);
}

const EMAIL = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;
export function email(val: string) {
	return val === '' || EMAIL.test(val) || ValidationMessage.email;
}
