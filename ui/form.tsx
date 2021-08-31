///<amd-module name="@cxl/ui/form.js"/>
import {
	StyleAttribute,
	Augment,
	Attribute,
	Component,
	Slot,
	get,
} from '@cxl/component';
import { ButtonBase, FocusCircleStyle, Spinner, Span } from './core.js';
import { dom } from '@cxl/tsx';
import { aria, ariaValue, onValue, triggerEvent } from '@cxl/template';
import { trigger, onKeypress, on, onAction } from '@cxl/dom';
import { border, css, padding } from '@cxl/css';
import { EMPTY, Observable, observable, defer, merge } from '@cxl/rx';
import { dragInside } from '@cxl/drag';
import { InputBase } from './input-base.js';
import {
	Focusable,
	checkedBehavior,
	focusable,
	registableHost,
	role,
} from '@cxl/template';
import { Field } from './field.js';
import { CloseIcon } from './icon.js';

/**
 * Sliders allow users to make selections from a range of values.
 * @example
 * <cxl-slider></cxl-slider>
 * <cxl-slider value="0.5"></cxl-slider>
 */
@Augment<Slider>(
	'cxl-slider',
	role('slider'),
	aria('valuemax', '1'),
	aria('valuemin', '0'),
	FocusCircleStyle,
	css({
		$: {
			display: 'block',
			paddingTop: 24,
			paddingBottom: 24,
			userSelect: 'none',
			position: 'relative',
			flexGrow: 1,
			cursor: 'pointer',
		},
		knob: {
			backgroundColor: 'primary',
			width: 12,
			height: 12,
			display: 'inline-block',
			borderRadius: 6,
			position: 'absolute',
			top: 19,
		},
		focusCircle: { marginLeft: -4, marginTop: -8, left: 'auto' },
		background: {
			backgroundColor: 'primaryLight',
			height: 2,
		},
		line: {
			display: 'block',
			backgroundColor: 'primary',
			height: 2,
			textAlign: 'right',
		},
		line$invalid$touched: { backgroundColor: 'error' },
		knob$invalid$touched: { backgroundColor: 'error' },
		background$invalid$touched: {
			backgroundColor: 'errorLight',
		},
	}),
	Focusable,
	host => {
		function bound(x: number) {
			return x < 0 ? 0 : x > 1 ? 1 : x;
		}
		host.bind(
			merge(
				dragInside(host).tap(ev => {
					if (!host.disabled) host.value = bound(ev.clientX);
				}),
				onKeypress(host, 'arrowleft').tap(
					() => (host.value = bound(host.value - host.step))
				),
				onKeypress(host, 'arrowright').tap(
					() => (host.value = bound(host.value + host.step))
				)
			)
		);

		return (
			<div className="background">
				<Span
					$={el =>
						get(host, 'value')
							.tap(
								val =>
									(el.style.marginRight =
										100 - val * 100 + '%')
							)
							.pipe(ariaValue(host, 'valuenow'))
					}
					className="line"
				>
					<span className="focusCircle"></span>
					<div className="knob"></div>
				</Span>
			</div>
		);
	}
)
export class Slider extends InputBase {
	@Attribute()
	step = 0.05;

	value = 0;
}

@Augment<SubmitButton>(
	'cxl-submit',
	css({
		icon: {
			animation: 'spin',
			marginRight: 8,
			display: 'none',
			width: 16,
			height: 16,
		},
		icon$disabled: { display: 'inline-block' },
	}),
	_ => (
		<>
			<Spinner className="icon" />
			<slot />
		</>
	),
	el => onAction(el).pipe(triggerEvent(el, 'form.submit'))
)
export class SubmitButton extends ButtonBase {
	primary = true;
}

function fieldInput<T extends Component>(host: T) {
	return defer(() =>
		host.parentNode instanceof Field
			? (get(host.parentNode, 'input').filter(
					inp => !!inp
			  ) as Observable<InputBase>)
			: EMPTY
	);
}

@Augment<Label>(
	'cxl-label',
	css({
		$: {
			display: 'inline-block',
			paddingLeft: 4,
			paddingRight: 4,
		},
	}),
	Slot,
	host =>
		fieldInput(host).raf(input =>
			input.setAttribute('aria-label', host.textContent || '')
		)
)
export class Label extends Component {}

/**
 * @example
 * <cxl-field>
 *   <cxl-label>Field Label</cxl-label>
 *   <cxl-input value="Input Value"></cxl-input>
 *   <cxl-field-help>Helper Text</cxl-field-help>
 * </cxl-field>
 * <cxl-field>
 *   <cxl-label>Field Label</cxl-label>
 *   <cxl-input touched invalid value="Input Value"></cxl-input>
 *   <cxl-field-help invalid>Field Error Text</cxl-field-help>
 * </cxl-field>
 *
 */
@Augment(
	'cxl-field-help',
	css({
		$: {
			display: 'block',
			lineHeight: 12,
			marginTop: 8,
			marginBottom: 8,
			font: 'caption',
			verticalAlign: 'bottom',
		},
		$invalid: { color: 'error' },
	}),
	Slot
)
export class FieldHelp extends Component {
	@StyleAttribute()
	invalid = false;
}

/**
 * Display the ratio of characters used and the total character limit.
 * @example
 * <cxl-field>
 *   <cxl-label>Input Label</cxl-label>
 *   <cxl-input></cxl-input>
 *   <cxl-field-counter max="100"></cxl-field-counter>
 * </cxl-field>
 */
@Augment<FieldCounter>('cxl-field-counter', host => (
	<Span>
		{fieldInput(host).switchMap(input =>
			get(input, 'value').map(val => val?.length || 0)
		)}
		/{get(host, 'max')}
	</Span>
))
export class FieldCounter extends Component {
	@Attribute()
	max = 100;
}

/**
 * @example
 * <cxl-form>
 *   <cxl-grid>
 *   <cxl-field>
 *     <cxl-label>E-mail Address</cxl-label>
 *     <cxl-input></cxl-input>
 *   </cxl-field>
 *   <cxl-field>
 *     <cxl-label>Password</cxl-label>
 *     <cxl-password></cxl-password>
 *   </cxl-field>
 *   </cxl-grid><br/>
 *   <cxl-submit>Submit</cxl-submit>
 * </cxl-form>
 */
@Augment<Form>('cxl-form', role('form'), host =>
	merge(
		on(host, 'form.submit').tap(ev => {
			host.submit();
			ev.stopPropagation();
		}),
		registableHost<InputBase>(host, 'form', host.elements),
		onKeypress(host, 'enter').tap(ev => {
			host.submit();
			ev.preventDefault();
		})
	)
)
export class Form extends Component {
	elements = new Set<InputBase>();

	submit() {
		let focus: InputBase | undefined;

		for (const el of this.elements) {
			if (el.invalid) focus = focus || el;
			el.touched = true;
		}

		if (focus) return focus.focus();
		trigger(this, 'submit');
	}

	getFormData() {
		const result: Record<string, any> = {};

		for (const el of this.elements) if (el.name) result[el.name] = el.value;

		return result;
	}
}

/**
 * Input fields let users enter and edit text.
 * @see FieldInput
 * @example
 * <cxl-field>
 * 	<cxl-label>Email Address</cxl-label>
 * 	<cxl-input value="email&#64;address.com"></cxl-input>
 * </cxl-field>
 */
@Augment<Input>(
	'cxl-input',
	role('textbox'),
	css({
		$: {
			display: 'block',
			flexGrow: 1,
			overflowY: 'hidden',
		},
		input: {
			color: 'onSurface',
			font: 'default',
			minHeight: 20,
			outline: 0,
		},
		$disabled: { pointerEvents: 'none' },
	}),
	ContentEditable
)
export class Input extends InputBase {
	value = '';
}

@Augment<FieldInput>(
	'cxl-field-input',
	role('textbox'),
	css({
		$: { display: 'block', gridColumnEnd: 'span 12' },
		input: {
			color: 'onSurface',
			font: 'default',
			minHeight: 20,
			outline: 0,
			flexGrow: 1,
		},
		$disabled: { pointerEvents: 'none' },
	}),
	host => (
		<Field
			input={host as any}
			floating={get(host, 'floating')}
			outline={get(host, 'outline')}
		>
			<Label>{get(host, 'label')}</Label>
			{ContentEditable(host)}
		</Field>
	)
)
export class FieldInput extends InputBase {
	@Attribute()
	outline = false;

	@Attribute()
	floating = false;

	@Attribute()
	label = '';
}

@Augment<FieldTextArea>(
	'cxl-field-textarea',
	css({
		$: { display: 'block', gridColumnEnd: 'span 12' },
		input: {
			minHeight: 20,
			lineHeight: 20,
			color: 'onSurface',
			outline: 'none',
			whiteSpace: 'pre-wrap',
			flexGrow: 1,
			textAlign: 'left',
		},
		$disabled: { pointerEvents: 'none' },
	}),
	host => (
		<Field
			input={host as any}
			floating={get(host, 'floating')}
			outline={get(host, 'outline')}
		>
			<Label>{get(host, 'label')}</Label>
			{ContentEditable(host, true)}
		</Field>
	)
)
export class FieldTextArea extends InputBase {
	@Attribute()
	outline = false;

	@Attribute()
	floating = false;

	@Attribute()
	label = '';
}

/**
 * Input field with password masking.
 * @example
 * <cxl-field floating>
 *   <cxl-label>Password</cxl-label>
 *   <cxl-password value="password"></cxl-password>
 * </cxl-field>
 */
@Augment<PasswordInput>(
	'cxl-password',
	role('textbox'),
	css({
		$: {
			display: 'block',
			flexGrow: 1,
			lineHeight: 22,
		},
		input: {
			display: 'block',
			...border(0),
			...padding(0),
			font: 'default',
			color: 'onSurface',
			outline: 0,
			width: '100%',
			height: 22,
			backgroundColor: 'transparent',
		},
		$disabled: { pointerEvents: 'none' },
	}),
	$ => $valueProxy($, (<input className="input" type="password" />) as any)
)
export class PasswordInput extends InputBase {
	@Attribute()
	maxlength?: number;

	value = '';
}

const radioElements = new Set<Radio>();

/**
 * Radio buttons allow the user to select one option from a set.
 * Use radio buttons when the user needs to see all available options.
 * @example
 * <cxl-radio inline name="test" value="1">Radio 1</cxl-radio>
 * <cxl-radio inline name="test" value="2" checked>Radio 2</cxl-radio>
 */
@Augment<Radio>(
	'cxl-radio',
	role('radio'),
	FocusCircleStyle,
	Focusable,
	css({
		$: {
			position: 'relative',
			cursor: 'pointer',
			marginRight: 16,
			marginLeft: 0,
			paddingTop: 12,
			paddingBottom: 12,
			display: 'block',
			font: 'default',
			textAlign: 'left',
		},
		$inline: { display: 'inline-block' },
		$invalid$touched: { color: 'error' },
		content: { lineHeight: 20 },
		circle: {
			borderRadius: 10,
			width: 10,
			height: 10,
			display: 'inline-block',
			backgroundColor: 'primary',
			scaleX: 0,
			scaleY: 0,
			marginTop: 3,
		},
		circle$checked: { scaleX: 1, scaleY: 1 },
		circle$invalid$touched: { backgroundColor: 'error' },
		box: {
			borderWidth: 2,
			width: 20,
			height: 20,
			display: 'inline-block',
			borderColor: 'onSurface',
			marginRight: 16,
			borderRadius: 10,
			borderStyle: 'solid',
			color: 'primary',
			lineHeight: 16,
			textAlign: 'center',
		},
		box$checked: { borderColor: 'primary' },
		box$invalid$touched: { borderColor: 'error' },
		box$checked$invalid$touched: { color: 'error' },
	}),
	_ => (
		<>
			<div className="focusCircle focusCirclePrimary" />
			<div className="box">
				<span className="circle"></span>
			</div>
			<slot />
		</>
	),
	host => {
		let registered = false;

		function unregister() {
			radioElements.delete(host);
			registered = false;
		}

		function register(name?: string) {
			if (registered) unregister();
			if (name) {
				radioElements.add(host);
				registered = true;
			}
		}

		return merge(
			observable(unregister),
			onAction(host).tap(() => {
				if (host.disabled) return;
				if (!host.checked) host.checked = host.touched = true;
			}),
			get(host, 'name').tap(register),
			get(host, 'checked').tap(val => {
				host.setAttribute('aria-checked', val ? 'true' : 'false');
				if (val) {
					trigger(host, 'change');
					radioElements.forEach(r => {
						if (r.name === host.name && r !== host) {
							r.checked = false;
							r.touched = true;
						}
					});
				}
			})
		);
	}
)
export class Radio extends InputBase {
	@StyleAttribute()
	checked = false;
}

/**
 * Switches toggle the state of a single item on or off.
 * @example
 * <cxl-switch></cxl-switch>
 */
@Augment<Switch>(
	'cxl-switch',
	role('switch'),
	FocusCircleStyle,
	css({
		$: {
			display: 'inline-block',
			cursor: 'pointer',
			paddingTop: 12,
			paddingBottom: 12,
		},
		switch: {
			position: 'relative',
			width: 46,
			height: 20,
			userSelect: 'none',
		},
		background: {
			position: 'absolute',
			display: 'block',
			left: 10,
			top: 2,
			height: 16,
			borderRadius: 8,
			width: 26,
			backgroundColor: 'divider',
		},

		knob: {
			width: 20,
			height: 20,
			borderRadius: 10,
			backgroundColor: 'surface',
			position: 'absolute',
			elevation: 1,
		},

		background$checked: { backgroundColor: 'primaryLight' },
		knob$checked: {
			translateX: 24,
			backgroundColor: 'primary',
		},
		knob$invalid$touched: { backgroundColor: 'error' },
		content$invalid$touched: { color: 'error' },
		focusCircle$checked: { backgroundColor: 'primary' },
	}),
	Focusable,
	_ => (
		<div className="switch">
			<span className="background =checked:#update"></span>
			<div className="knob">
				<span className="focusCircle"></span>
			</div>
		</div>
	),
	host =>
		merge(
			onAction(host).tap(() => {
				if (host.disabled) return;
				host.checked = !host.checked;
			}),
			checkedBehavior(host).tap(() => (host.value = host.checked))
		)
)
export class Switch extends InputBase {
	value = false;
	@StyleAttribute()
	checked = false;
}

export function focusProxy(el: HTMLElement, host: InputBase) {
	host.focusElement = el;
	return focusable(host, el);
}

function $valueProxy<T extends InputBase>(host: T, el: HTMLInputElement) {
	host.bind(
		merge(
			focusProxy(el, host),
			get(host, 'value').tap(val => {
				if (el.value !== val) el.value = val;
			}),
			get(host, 'disabled').tap(val => (el.disabled = val)),
			onValue(el).tap(() => (host.value = el.value))
		)
	);
	return el;
}

function contentEditable<T extends InputBase>(
	el: HTMLElement,
	host: T,
	multiLine = false
) {
	return merge(
		focusProxy(el, host),
		get(host, 'value').tap(val => {
			if (el.textContent !== val) el.textContent = val;
		}),
		get(host, 'disabled').raf(
			val => (el.contentEditable = val ? 'false' : 'true')
		),
		on(host, 'paste').tap((e: any) => {
			e.preventDefault();
			const text = (e.originalEvent || e).clipboardData.getData(
				'text/plain'
			);
			document.execCommand('insertText', false, text);
		}),
		on(el, 'input').tap(() => (host.value = el.textContent)),
		onKeypress(el, 'enter').tap(ev =>
			multiLine ? ev.stopPropagation() : ev.preventDefault()
		)
	);
}

export function ContentEditable<T extends InputBase>(host: T, multi = false) {
	const el = (<div className="input" />) as HTMLDivElement;
	host.bind(contentEditable(el, host, multi));
	return el;
}

/**
 * Text fields let users enter and edit text that spans in multiple lines.
 * @example
 * <cxl-field>
 *   <cxl-label>Prefilled Text Area</cxl-label>
 *   <cxl-textarea value="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut"></cxl-textarea>
 * </cxl-field>
 */
@Augment<TextArea>(
	'cxl-textarea',
	role('textbox'),
	css({
		$: {
			display: 'block',
			position: 'relative',
			flexGrow: 1,
			overflowX: 'hidden',
		},
		input: {
			minHeight: 20,
			lineHeight: 20,
			height: '100%',
			whiteSpace: 'pre-wrap',
			color: 'onSurface',
			outline: 'none',
			textAlign: 'left',
		},
		$disabled: { pointerEvents: 'none' },
	}),
	$ => ContentEditable($, true)
)
export class TextArea extends InputBase {
	value = '';
}

/**
 * @beta
 */
@Augment(
	'cxl-field-clear',
	css({
		$: {
			opacity: 0.5,
			cursor: 'pointer',
		},
		$hover: {
			opacity: 1,
		},
	}),
	$ => (
		<Span
			tabIndex={0}
			$={el =>
				onAction(el).tap(() => {
					const input = ($.parentElement as any)?.input;
					if (input) input.value = '';
				})
			}
		>
			<CloseIcon width={20} />
		</Span>
	)
)
export class FieldClear extends Component {}
