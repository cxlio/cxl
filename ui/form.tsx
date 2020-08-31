import {
	StyleAttribute,
	Augment,
	Attribute,
	Component,
	Host,
	Slot,
	attributeChanged,
	bind,
	render,
	get,
	role,
} from '../component/index.js';
import {
	ButtonBase,
	Spinner,
	Toggle,
	FocusHighlight,
	Focusable,
	IconButton,
	Svg,
	aria,
	ariaValue,
	ariaChecked,
	focusable,
	navigationList,
	registable,
	registableHost,
	selectable,
	selectableHost,
} from './core.js';
import { dom } from '../xdom/index.js';
import { onValue, tpl, triggerEvent } from '../template/index.js';
import {
	trigger,
	onKeypress,
	on,
	onAction,
	setAttribute,
} from '../dom/index.js';
import { Style, border, boxShadow, padding } from '../css/index.js';
import { EMPTY, Observable, be, defer, merge, tap } from '../rx/index.js';
import { dragInside } from '../drag/index.js';

const FocusCircleStyle = (
	<Style>
		{{
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
		}}
	</Style>
);

const Undefined = {};

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

/**
 * Checkboxes allow the user to select one or more items from a set. Checkboxes can be used to turn an option on or off.
 * @example
 * <cxl-checkbox>Checkbox Label</cxl-checkbox>
 * <cxl-checkbox checked>Checkbox Label</cxl-checkbox>
 * <cxl-checkbox indeterminate>Checkbox Indeterminate</cxl-checkbox>
 * <cxl-checkbox indeterminate checked>Checkbox Checked Indeterminate</cxl-checkbox>
 */
@Augment<Checkbox>(
	'cxl-checkbox',
	role('checkbox'),
	bind(host => {
		const update = tap<any>(
			() =>
				(host.value = host.indeterminate
					? undefined
					: host.checked
					? host['true-value']
					: host['false-value'])
		);
		return merge(
			onAction(host).tap(ev => {
				if (host.disabled) return;
				if (host.indeterminate) {
					host.checked = false;
					host.indeterminate = false;
				} else host.checked = !host.checked;

				ev.preventDefault();
			}),
			get(host, 'value').tap(val => {
				if (val !== Undefined)
					host.checked = val === host['true-value'];
			}),
			get(host, 'checked').pipe(ariaChecked(host), update),
			get(host, 'indeterminate').pipe(update),
			get(host, 'true-value').pipe(update),
			get(host, 'false-value').pipe(update)
		);
	}),
	FocusCircleStyle,
	<Host>
		<Focusable />
		<Style>
			{{
				$: {
					marginRight: 16,
					marginLeft: 0,
					position: 'relative',
					cursor: 'pointer',
					paddingTop: 12,
					paddingBottom: 12,
					display: 'block',
					paddingLeft: 28,
					lineHeight: 20,
				},
				$inline: { display: 'inline-block' },
				$invalid$touched: { color: 'error' },
				box: {
					display: 'inline-block',
					width: 20,
					height: 20,
					borderWidth: 2,
					borderColor: 'onSurface',
					borderStyle: 'solid',
					top: 11,
					left: 0,
					position: 'absolute',
					color: 'transparent',
				},
				check: { display: 'none' },
				minus: { display: 'none' },
				check$checked: { display: 'initial' },
				check$indeterminate: { display: 'none' },
				minus$indeterminate: { display: 'initial' },
				box$checked: {
					borderColor: 'primary',
					backgroundColor: 'primary',
					color: 'onPrimary',
				},
				box$indeterminate: {
					borderColor: 'primary',
					backgroundColor: 'primary',
					color: 'onPrimary',
				},
				box$invalid$touched: { borderColor: 'error' },
				focusCircle: { top: -2, left: -2 },
			}}
		</Style>
		<div className="box">
			<span className="focusCircle focusCirclePrimary" />
			<Svg
				className="check"
				viewBox="0 0 24 24"
			>{`<path stroke-width="4" style="fill:currentColor;stroke:currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>`}</Svg>
			<Svg
				className="minus"
				viewBox="0 0 24 24"
			>{`<path stroke-width="4" style="fill:currentColor;stroke:currentColor" d="M19 13H5v-2h14v2z" />`}</Svg>
		</div>
		<slot />
	</Host>
)
export class Checkbox extends InputBase {
	value: any = Undefined;

	@StyleAttribute()
	checked = false;
	@StyleAttribute()
	indeterminate = false;
	@StyleAttribute()
	inline = false;

	@Attribute()
	'true-value': any = true;
	@Attribute()
	'false-value': any = false;
}

/**
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
	<Style>
		{{
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
			focusCircle: { marginLeft: -4, marginTop: -8 },
			background: {
				backgroundColor: 'primaryLight',
				height: 2,
			},
			line: {
				backgroundColor: 'primary',
				height: 2,
				textAlign: 'right',
			},
			line$invalid$touched: { backgroundColor: 'error' },
			knob$invalid$touched: { backgroundColor: 'error' },
			background$invalid$touched: {
				backgroundColor: 'errorLight',
			},
		}}
	</Style>,
	tpl(() => {
		function bound(x: number) {
			return x < 0 ? 0 : x > 1 ? 1 : x;
		}

		return (
			<Host
				$={(host: Slider) =>
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
				}
			>
				<Focusable />
				<div className="background">
					<div
						$={(el, host: Slider) =>
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
					</div>
				</div>
			</Host>
		);
	})
)
export class Slider extends InputBase {
	@Attribute()
	step = 0.05;

	value = 0;
}

@Augment<SubmitButton>(
	'cxl-submit',
	<Host>
		<Style>
			{{
				icon: {
					animation: 'spin',
					marginRight: 8,
					display: 'none',
					width: 16,
					height: 16,
				},
				icon$disabled: { display: 'inline-block' },
			}}
		</Style>
		<Spinner className="icon" />
		<slot />
	</Host>,
	bind(el => onAction(el).pipe(triggerEvent(el, 'form.submit')))
)
export class SubmitButton extends ButtonBase {
	primary = true;
}

const FieldBase = (
	<Host>
		<Style>
			{{
				$: {
					color: 'onSurface',
					position: 'relative',
					display: 'block',
				},
				container: {
					position: 'relative',
					...padding(0, 12, 4, 12),
				},
				$invalid: { color: 'error' },
				$outline: { marginTop: -2 },
				container$outline: {
					borderColor: 'onSurface',
					borderWidth: 1,
					borderStyle: 'solid',
					borderRadius: 4,
					marginTop: 2,
					paddingTop: 12,
					paddingBottom: 12,
				},
				container$outline$focusWithin: {
					boxShadow: boxShadow(0, 0, 0, 1, 'primary'),
				},
				container$focusWithin$outline: {
					borderColor: 'primary',
				},
				container$invalid$outline: { borderColor: 'error' },
				container$invalid$outline$focusWithin: {
					boxShadow: boxShadow(0, 0, 0, 1, 'error'),
				},
				content: {
					display: 'flex',
					position: 'relative',
					font: 'default',
					// marginBottom: 2,
					marginTop: 4,
					lineHeight: 20,
				},
				content$focusWithin: {
					color: 'primary',
				},
				mask: {
					position: 'absolute',
					top: 0,
					right: 0,
					left: 0,
					bottom: 0,
					backgroundColor: 'onSurface8',
				},
				mask$outline: {
					borderRadius: 4,
					backgroundColor: 'surface',
				},
				mask$hover: {
					filter: 'invert(0.15) saturate(1.5) brightness(1.1)',
				},
				mask$hover$disabled: { filter: 'none' },
				label: {
					position: 'relative',
					font: 'caption',
					marginLeft: -4,
					paddingTop: 8,
					paddingBottom: 2,
					lineHeight: 10,
					verticalAlign: 'bottom',
				},
				label$focusWithin: { color: 'primary' },
				label$invalid: { color: 'error' },
				label$outline: {
					position: 'absolute',
					translateY: -17,
					paddingTop: 0,
					height: 5,
					backgroundColor: 'surface',
					display: 'inline-block',
				},
				label$floating$novalue: {
					font: 'default',
					translateY: 21,
					opacity: 0.75,
				},
				label$leading: { paddingLeft: 24 },
				label$floating$novalue$outline: {
					translateY: 9,
				},
			}}
		</Style>
		<div className="container">
			<div className="mask"></div>
			<div className="label">
				<Slot selector="cxl-label" />
			</div>
			<div className="content">
				<slot />
			</div>
		</div>
	</Host>
);

function fieldInput(host: Component) {
	return defer(() =>
		host.parentNode instanceof Field
			? (get(host.parentNode, 'input').filter(inp => !!inp) as Observable<
					InputBase
			  >)
			: undefined
	);
}

@Augment<Label>(
	'cxl-label',
	<Style>
		{{
			$: {
				display: 'inline-block',
				paddingLeft: 4,
				paddingRight: 4,
			},
		}}
	</Style>,
	<slot />,
	bind(host =>
		fieldInput(host).raf(input =>
			input.setAttribute('aria-label', host.textContent || '')
		)
	)
)
export class Label extends Component {}

/**
 * @example
 * <cxl-field>
 *   <cxl-label>Input Label</cxl-label>
 *   <cxl-input required></cxl-input>
 * </cxl-field>
 * <cxl-field floating>
 *   <cxl-label>Floating Label</cxl-label>
 *   <cxl-input></cxl-input>
 * </cxl-field>
 * <cxl-field outline>
 *   <cxl-label>Outlined Form Group</cxl-label>
 *   <cxl-input></cxl-input>
 *   <cxl-field-help>Field Help Text</cxl-field-help>
 * </cxl-field>
 */
@Augment<Field>(
	'cxl-field',
	<Style>
		{{
			$: { marginBottom: 16 },
			$lastChild: { marginBottom: 0 },
			line: { position: 'absolute', left: 0, right: 0 },
			line$outline: { display: 'none' },
			help: {
				font: 'caption',
				position: 'relative',
				display: 'flex',
				paddingTop: 4,
				flexGrow: 1,
				paddingLeft: 12,
				paddingRight: 12,
			},
			counter: { textAlign: 'right' },
			help$leading: { paddingLeft: 38 },
			invalidMessage: { display: 'none', paddingTop: 4 },
			invalidMessage$invalid: { display: 'block' },
			$inputdisabled: {
				filter: 'saturate(0)',
				opacity: 0.6,
				pointerEvents: 'none',
			},
		}}
	</Style>,
	FieldBase,
	render(host => {
		const invalid = be(false);
		const focused = be(false);
		const invalidMessage = be('');

		function onRegister(ev: Event) {
			if (ev.target) {
				host.input = ev.target as InputBase;
			}
		}

		function update(ev?: any) {
			const input = host.input;
			if (input) {
				invalid.next(input.touched && input.invalid);
				host.inputdisabled = input.disabled;
				host.invalid = invalid.value;
				if (host.invalid) invalidMessage.next(input.validationMessage);
				if (!ev) return;
				if (ev.type === 'focusable.focus') focused.next(true);
				else if (ev.type === 'focusable.blur') focused.next(false);
			}
		}

		function onChange() {
			const value = host.input?.value;
			host.novalue = !value || value.length === 0;
		}

		const hostBindings = merge(
			get(host, 'input').switchMap(input =>
				input
					? merge(
							defer(update),
							on(input, 'focusable.change').tap(update),
							on(input, 'focusable.focus').tap(update),
							on(input, 'focusable.blur').tap(update),
							on(input, 'invalid').tap(update),
							on(input, 'input').tap(onChange),
							on(input, 'change').tap(onChange),
							on(host, 'click').tap(
								() =>
									document.activeElement !== input &&
									!focused.value &&
									input?.focus()
							)
					  )
					: EMPTY
			),
			on(host, 'form.register').tap(onRegister)
		);

		return (
			<Host $={() => hostBindings}>
				<FocusLine
					className="line"
					focused={focused}
					invalid={invalid}
				/>
				<div className="help">
					<Slot selector="cxl-field-help" />
					<div className="invalidMessage">{invalidMessage}</div>
				</div>
			</Host>
		);
	})
)
export class Field extends Component {
	@StyleAttribute()
	outline = false;
	@StyleAttribute()
	protected inputdisabled = false;
	@StyleAttribute()
	invalid = false;
	@StyleAttribute()
	floating = false;
	@StyleAttribute()
	leading = false;
	@StyleAttribute()
	novalue = true;
	@Attribute()
	input?: InputBase;
}

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
	<Style>
		{{
			$: {
				display: 'block',
				lineHeight: 12,
				paddingTop: 4,
				font: 'caption',
				verticalAlign: 'bottom',
			},
			$invalid: { color: 'error' },
		}}
	</Style>,
	<slot />
)
export class FieldHelp extends Component {
	@StyleAttribute()
	invalid = false;
}

@Augment<Fieldset>(
	'cxl-fieldset',
	FieldBase,
	bind(host =>
		merge(on(host, 'invalid'), on(host, 'form.register')).tap(ev => {
			const target = ev.target as InputBase;
			if (target)
				setAttribute(host, 'invalid', target.touched && target.invalid);
		})
	),
	<Style>
		{{
			$: { marginBottom: 16 },
			mask: { display: 'none' },
			content: { display: 'block', marginTop: 16 },
			content$outline: { marginTop: 0, marginBottom: 0 },
		}}
	</Style>
)
export class Fieldset extends Component {
	@StyleAttribute()
	outline = true;
}

@Augment(
	'cxl-field-toggle',
	FocusCircleStyle,
	<Host>
		<Style>
			{{
				$: {
					paddingTop: 8,
					paddingBottom: 8,
					paddingLeft: 12,
					paddingRight: 12,
					cursor: 'pointer',
					position: 'relative',
				},
				focusCircle: { left: -4 },
			}}
		</Style>
		<span className="focusCircle focusCirclePrimary"></span>
		<Toggle>
			<slot />
		</Toggle>
	</Host>
)
export class FieldToggle extends Component {}

@Augment<FieldCounter>(
	'cxl-field-counter',
	render(host => (
		<Host>
			{fieldInput(host).switchMap(input =>
				get(input, 'value').map(val => val?.length || 0)
			)}
			/{get(host, 'max')}
		</Host>
	))
)
export class FieldCounter extends Component {
	@Attribute()
	max = 100;
}

@Augment(
	'cxl-focus-line',
	<Style>
		{{
			$: {
				display: 'block',
				height: 2,
				borderWidth: 0,
				borderTop: 1,
				borderStyle: 'solid',
				borderColor: 'onSurface',
			},
			$invalid: { borderColor: 'error' },
			line: {
				backgroundColor: 'primary',
				marginTop: -1,
				scaleX: 0,
				height: 2,
			},
			line$focused: { scaleX: 1 },
			line$invalid: { backgroundColor: 'error' },
		}}
	</Style>,
	<div className="line" />
)
export class FocusLine extends Component {
	@StyleAttribute()
	focused = false;

	@StyleAttribute()
	invalid = false;
}

/**
 * @example
 * <cxl-form>
 *   <cxl-field>
 *     <cxl-label>E-mail Address</cxl-label>
 *     <cxl-input &="valid(email)"></cxl-input>
 *   </cxl-field>
 *   <cxl-field>
 *     <cxl-label>Password</cxl-label>
 *     <cxl-password &="valid(required)"></cxl-password>
 *   </cxl-field>
 *   <cxl-submit>Submit</cxl-submit>
 * </cxl-form>
 */
@Augment<Form>(
	'cxl-form',
	role('form'),
	bind(host =>
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
	),
	<slot />
)
export class Form extends Component {
	@Attribute()
	autocomplete = 'off';

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
 * @example
 * <cxl-field>
 * 	<cxl-label>Email Address</cxl-label>
 * 	<cxl-input value="email&#64;address.com"></cxl-input>
 * </cxl-field>
 */
@Augment<Input>(
	'cxl-input',
	role('textbox'),
	bind(host => onKeypress(host, 'enter').tap(ev => ev.preventDefault())),
	<Style>
		{{
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
		}}
	</Style>,
	<div className="input" $={$contentEditable}></div>
)
export class Input extends InputBase {
	value = '';
}

@Augment<FieldInput>(
	'cxl-field-input',
	role('textbox'),
	bind(host => onKeypress(host, 'enter').tap(ev => ev.preventDefault())),
	<Style>
		{{
			$lastChild: { marginBottom: 0 },
			$: { display: 'block', marginBottom: 16 },
			input: {
				color: 'onSurface',
				font: 'default',
				minHeight: 20,
				outline: 0,
				flexGrow: 1,
			},
			$disabled: { pointerEvents: 'none' },
		}}
	</Style>,
	render(host => (
		<Field
			input={host}
			floating={get(host, 'floating')}
			outline={get(host, 'outline')}
		>
			<Label>{get(host, 'label')}</Label>
			<div className="input" $={$contentEditable}></div>
		</Field>
	))
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
	<Style>
		{{
			$: { display: 'block', marginBottom: 16 },
			$lastChild: { marginBottom: 0 },
			input: {
				minHeight: 20,
				lineHeight: 20,
				color: 'onSurface',
				outline: 'none',
				flexGrow: 1,
			},
			$disabled: { pointerEvents: 'none' },
		}}
	</Style>,
	render(host => (
		<Field
			input={host}
			floating={get(host, 'floating')}
			outline={get(host, 'outline')}
		>
			<Label>{get(host, 'label')}</Label>
			<div $={$contentEditable} className="input"></div>
		</Field>
	))
)
export class FieldTextArea extends InputBase {
	@Attribute()
	outline = false;

	@Attribute()
	floating = false;

	@Attribute()
	label = '';
}

@Augment<Option>(
	'cxl-option',
	role('option'),
	bind(selectable),
	bind(host => get(host, 'value').pipe(triggerEvent(host, 'change'))),
	<Host>
		<Style>
			{{
				$: {
					cursor: 'pointer',
					color: 'onSurface',
					lineHeight: 20,
					paddingRight: 16,
					display: 'flex',
					backgroundColor: 'surface',
					paddingLeft: 16,
					font: 'default',
					paddingTop: 14,
					paddingBottom: 14,
				},
				box: {
					display: 'none',
					width: 20,
					height: 20,
					borderWidth: 2,
					borderColor: 'onSurface',
					marginRight: 12,
					lineHeight: 16,
					borderStyle: 'solid',
					color: 'transparent',
				},
				box$multiple: { display: 'inline-block' },
				box$selected: {
					borderColor: 'primary',
					backgroundColor: 'primary',
					color: 'onPrimary',
				},
				content: { flexGrow: 1 },
				$focused: {
					backgroundColor: 'primaryLight',
					color: 'onPrimaryLight',
				},
				$inactive: {
					backgroundColor: 'transparent',
					color: 'onSurface',
				},
			}}
		</Style>
		<div className="box">
			<span className="focusCircle focusCirclePrimary" />
			<Svg
				className="check"
				viewBox="0 0 24 24"
			>{`<path stroke-width="4" style="fill:currentColor;stroke:currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>`}</Svg>
		</div>
		<div className="content">
			<slot />
		</div>
	</Host>
)
export class Option extends Component {
	@Attribute()
	value: any = null;

	@StyleAttribute()
	selected = false;

	@StyleAttribute()
	focused = false;

	@StyleAttribute()
	inactive = false;

	@StyleAttribute()
	multiple = false;
}

/**
 * @example
 * <cxl-field floating>
 *   <cxl-label>Email Address</cxl-label>
 *   <cxl-password value="password"></cxl-input>
 * </cxl-field>
 */
@Augment<PasswordInput>(
	'cxl-password',
	role('textbox'),
	<Host>
		<Style>
			{{
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
			}}
		</Style>
		<input $={$valueProxy} className="input" type="password" />
	</Host>
)
export class PasswordInput extends InputBase {
	@Attribute()
	maxlength?: number;

	value = '';
}

const radioElements = new Set<Radio>();

/**
 * @example
<cxl-radio name="test" value="1">Radio Button 1</cxl-radio>
<cxl-radio name="test" value="2" checked>Radio Button 2</cxl-radio>
<cxl-radio name="test" value="3">Radio Button 3</cxl-radio>
 */
@Augment<Radio>(
	'cxl-radio',
	role('radio'),
	FocusCircleStyle,
	<Host>
		<Focusable />
		<Style>
			{{
				$: {
					position: 'relative',
					cursor: 'pointer',
					marginRight: 16,
					marginLeft: 0,
					paddingTop: 12,
					paddingBottom: 12,
					display: 'block',
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
					marginRight: 8,
					borderRadius: 10,
					borderStyle: 'solid',
					color: 'primary',
					lineHeight: 16,
					textAlign: 'center',
				},
				box$checked: { borderColor: 'primary' },
				box$invalid$touched: { borderColor: 'error' },
				box$checked$invalid$touched: { color: 'error' },
			}}
		</Style>
		<div className="focusCircle focusCirclePrimary" />
		<div className="box">
			<span className="circle"></span>
		</div>
		<slot />
	</Host>,
	bind(host => {
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
			defer(unregister),
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
	})
)
export class Radio extends InputBase {
	@StyleAttribute()
	checked = false;
}

@Augment<SelectMenu>(
	'cxl-select-menu',
	<Style>
		{{
			$: {
				position: 'absolute',
				opacity: 0,
				elevation: 0,
				right: -16,
				left: -16,
				overflowY: 'hidden',
				transformOrigin: 'top',
				pointerEvents: 'none',
			},
			$visible: {
				elevation: 3,
				opacity: 1,
				overflowY: 'auto',
				backgroundColor: 'surface',
				pointerEvents: 'auto',
			},
		}}
	</Style>,
	<slot />
)
export class SelectMenu extends Component {
	@StyleAttribute()
	visible = false;
}

@Augment(
	role('listbox'),
	tpl(_ => {
		return (
			<Host
				$={(el: SelectBase) =>
					merge(
						focusable(el),
						registableHost<Option>(el, 'selectable').tap(options =>
							el.setOptions(options)
						),
						on(el, 'blur').tap(() => el.close()),
						onKeypress(el, 'escape').tap(() => el.close())
					)
				}
			>
				<Style>
					{{
						$: {
							display: 'inline-block',
							cursor: 'pointer',
							overflowY: 'hidden',
							overflowX: 'hidden',
							height: 20,
							position: 'relative',
							paddingRight: 16,
							flexGrow: 1,
						},
						$focus: { outline: 0 },
						caret: {
							position: 'absolute',
							right: 0,
							top: 0,
							lineHeight: 20,
							width: 20,
							height: 20,
						},
						$opened: { overflowY: 'visible', overflowX: 'visible' },
						$disabled: { pointerEvents: 'none' },
						placeholder: {
							color: 'onSurface',
							font: 'default',
							marginRight: 12,
						},
					}}
				</Style>
				<Svg className="caret" viewBox="0 0 24 24">
					{'<path d="M7 10l5 5 5-5z"></path>'}
				</Svg>
			</Host>
		);
	})
)
abstract class SelectBase extends InputBase {
	@StyleAttribute()
	opened = false;

	@Attribute()
	readonly options?: Set<Option>;

	protected setOptions(options: Set<Option>) {
		(this as any).options = options;
	}

	protected abstract setSelected(option: Option): void;
	abstract open(): void;
	abstract close(): void;
}

/**
 * A form input component that allows the user to select a single option from a list
 *
 * @example
 * <cxl-field>
 *   <cxl-label>Select Box</cxl-label>
 *   <cxl-select>
 *     <cxl-option>Option 1</cxl-option>
 *     <cxl-option selected>Option 2</cxl-option>
 *     <cxl-option>Option 3</cxl-option>
 *   </cxl-select>
 * </cxl-field>
 *
 * @see MultiSelect
 */
@Augment<SelectBox>(
	'cxl-select',
	bind(host =>
		merge(
			navigationList(
				host,
				'cxl-option:not([disabled])',
				'cxl-option:not([disabled])[selected]'
			).tap(selected => host.setSelected(selected as Option)),
			selectableHost(host).tap(selected =>
				host.setSelected(selected as Option)
			),
			onAction(host).tap(() => !host.opened && host.open())
		)
	),
	<SelectMenu
		$={(el, host) =>
			merge(get(host, 'opened'), get(host, 'selected')).raf(() =>
				host.positionMenu(el)
			)
		}
		visible={(_el, host) => get(host, 'opened')}
	>
		<slot />
	</SelectMenu>,
	render(host => <div className="placeholder">{host.selectedText$}</div>)
)
export class SelectBox extends SelectBase {
	@Attribute()
	selected?: Option;

	protected selectedText$ = be('');

	protected positionMenu(menu: SelectMenu) {
		const option = this.selected;
		const rect = this.getBoundingClientRect();
		const menuTopPadding = 13;
		const maxTranslateY = rect.top;

		let height: number;
		let scrollTop = 0;
		let translateY = option ? option.offsetTop : 0;

		if (translateY > maxTranslateY) {
			scrollTop = translateY - menuTopPadding;
			translateY = maxTranslateY;
		}

		height = menu.scrollHeight - scrollTop;
		const maxHeight = window.innerHeight - rect.bottom + translateY;

		if (height > maxHeight) height = maxHeight;
		else if (height < rect.height) height = rect.height;

		const style = menu.style;
		style.transform =
			'translateY(' + (-translateY - menuTopPadding) + 'px)';
		style.height = height + 'px';
		menu.scrollTop = scrollTop;
	}

	protected setSelected(option: Option) {
		if (this.selected)
			this.selected.selected = this.selected.focused = false;
		option.selected = option.focused = true;
		this.selected = option;
		this.selectedText$.next(option.textContent || '');
		this.value = option.value;
		this.close();
	}

	open() {
		if (this.disabled || this.opened) return;
		if (this.selected) this.selected.inactive = false;
		this.opened = true;
	}

	close() {
		if (this.opened) this.opened = false;
		if (this.selected) this.selected.inactive = true;
	}
}

/**
 * @example
 * <cxl-field>
 *   <cxl-label>Multi Select Box with label</cxl-label>
 *   <cxl-multiselect placeholder="(Select an Option)">
 *     <cxl-option selected value="1">Option 1</cxl-option>
 *     <cxl-option selected value="2">Option 2</cxl-option>
 *     <cxl-option value="3">Option 3</cxl-option>
 *   </cxl-multiselect>
 * </cxl-field>
 */
@Augment<MultiSelect>(
	'cxl-multiselect',
	<Host>
		<Style>
			{{
				menu: { left: -12, right: -12, top: 26, height: 0 },
				menu$opened: { height: 'auto' },
			}}
		</Style>
		<SelectMenu
			$={(el, host) =>
				get(host, 'opened').raf(() => host.positionMenu(el))
			}
			className="menu"
			visible={(_el, host) => get(host, 'opened')}
		>
			<slot />
		</SelectMenu>
	</Host>,
	bind(host =>
		merge(
			onAction(host).tap(() => {
				if (host.focusedOption) host.setSelected(host.focusedOption);
				else host.open();
			}),
			selectableHost(host, true).tap(selected =>
				host.setSelected(selected as Option)
			),
			navigationList(
				host,
				'cxl-option:not([disabled])',
				'cxl-option[focused]'
			).tap(selected => host.setFocusedOption(selected as Option))
		)
	),
	render(host => <div className="placeholder">{host.selectedText$}</div>)
)
export class MultiSelect extends SelectBase {
	/**
	 * Placeholder value if nothing is selected.
	 */
	@Attribute()
	placeholder = '';

	selectedText$ = be('');
	readonly selected: Set<Option> = new Set<Option>();
	value: any[] = [];

	protected focusedOption?: Option;

	protected positionMenu(menu: SelectMenu) {
		let height: number;
		const rect = this.getBoundingClientRect();
		height = menu.scrollHeight;
		const maxHeight = window.innerHeight - rect.bottom;

		if (height > maxHeight) height = maxHeight;
		const style = menu.style;
		style.height = height + 'px';
	}

	protected setOptions(options: Set<Option>) {
		super.setOptions(options);
		options.forEach(o => (o.multiple = true));
	}

	protected setSelected(option: Option) {
		option.selected = !this.selected.has(option);
		const method = option.selected ? 'add' : 'delete';
		this.selected[method](option);
		const selected = [...this.selected];
		this.value = selected.map(o => o.value);
		this.selectedText$.next(
			selected.map(s => s.textContent).join(', ') || this.placeholder
		);
		if (this.opened) this.setFocusedOption(option);
	}

	protected setFocusedOption(option: Option) {
		this.clearFocusedOption();
		this.focusedOption = option;
		option.focused = true;
	}

	protected clearFocusedOption() {
		this.options?.forEach(o => (o.focused = false));
		this.focusedOption = undefined;
	}

	open() {
		if (this.disabled || this.opened) return;
		this.opened = true;
	}

	close() {
		if (this.opened) {
			this.opened = false;
			this.clearFocusedOption();
		}
	}
}

/**
 * @example
 * <cxl-switch></cxl-switch>
 */
@Augment<Switch>(
	'cxl-switch',
	role('switch'),
	FocusCircleStyle,
	<Host>
		<Style>
			{{
				$: {
					display: 'flex',
					cursor: 'pointer',
					paddingTop: 12,
					paddingBottom: 12,
				},
				$inline: { display: 'inline-flex' },
				content: { flexGrow: 1 },
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
			}}
		</Style>
		<Focusable />
		<div className="switch">
			<span className="background =checked:#update"></span>
			<div className="knob">
				<span className="focusCircle"></span>
			</div>
		</div>
	</Host>,
	bind(host => {
		return merge(
			onAction(host).tap(() => {
				if (host.disabled) return;
				host.checked = !host.checked;
			}),
			get(host, 'value').tap(val => {
				if (val !== Undefined)
					host.checked = val === host['true-value'];
			}),
			get(host, 'checked').tap(val => {
				host.setAttribute('aria-checked', val ? 'true' : 'false');
				host.value = val ? host['true-value'] : host['false-value'];
			})
		);
	})
)
export class Switch extends InputBase {
	value = Undefined;
	@StyleAttribute()
	checked = false;
	@Attribute()
	'true-value': any = true;
	@Attribute()
	'false-value': any = false;
}

function $focusProxy(el: HTMLElement, host: InputBase) {
	host.focusElement = el;
	return focusable(host, el);
}

function $valueProxy(el: HTMLInputElement, host: InputBase) {
	return merge(
		$focusProxy(el, host),
		get(host, 'value').tap(val => {
			if (el.value !== val) el.value = val;
		}),
		get(host, 'disabled').tap(val => (el.disabled = val)),
		onValue(el).tap(() => (host.value = el.value))
	);
}

function $contentEditable(el: HTMLElement, host: InputBase) {
	return merge(
		$focusProxy(el, host),
		get(host, 'value').tap(val => {
			if (el.textContent !== val) el.textContent = val;
		}),
		get(host, 'disabled').raf(
			val => (el.contentEditable = val ? 'false' : 'true')
		),
		on(el, 'input').tap(() => (host.value = el.textContent))
	);
}

/**
 * @example
 * <cxl-field>
 *   <cxl-label>Prefilled Text Area</cxl-label>
 *   <cxl-textarea value="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."></cxl-textarea>
 * </cxl-field>
 */
@Augment<TextArea>(
	'cxl-textarea',
	role('textarea'),
	<Host>
		<Style>
			{{
				$: {
					display: 'block',
					position: 'relative',
					flexGrow: 1,
				},
				input: {
					minHeight: 20,
					lineHeight: 20,
					color: 'onSurface',
					outline: 'none',
				},
				$disabled: { pointerEvents: 'none' },
			}}
		</Style>
		<div $={$contentEditable} className="input"></div>
	</Host>
)
export class TextArea extends InputBase {
	value = '';
}

/**
 * A floating action button (FAB) represents the primary action of a screen.
 * @demo
 * <cxl-fab title="Floating Action Button"><cxl-icon icon="plus"></cxl-icon></cxl-fab>
 */
@Augment(
	'cxl-fab',
	<Host>
		<Focusable />
		<Style>
			{{
				$: {
					display: 'inline-block',
					elevation: 2,
					backgroundColor: 'secondary',
					color: 'onSecondary',
					position: 'fixed',
					width: 56,
					height: 56,
					bottom: 16,
					right: 24,
					borderRadius: 56,
					textAlign: 'center',
					paddingTop: 20,
					cursor: 'pointer',
					font: 'h6',
					paddingBottom: 20,
					lineHeight: 16,
				},
				$static: { position: 'static' },
				$focus: { elevation: 4 },
			}}
		</Style>
		<Style>{FocusHighlight}</Style>
		<slot />
	</Host>
)
export class Fab extends Component {
	@StyleAttribute()
	disabled = false;
	@StyleAttribute()
	static = false;

	touched = false;
}

/**
 * @demo
 * <cxl-appbar>
 *   <cxl-appbar-title>Appbar Title</cxl-appbar-title>
 *   <cxl-appbar-search></cxl-appbar-search>
 * </cxl-appbar>
 * @see Appbar
 */
@Augment(
	'cxl-appbar-search',
	<Host>
		<Style>
			{{
				$: { display: 'flex' },
				input: { width: 200, display: 'none', marginBottom: 0 },
				input$opened: { display: 'block' },
				'@medium': {
					input: { display: 'block' },
					button: { display: 'none' },
				},
			}}
		</Style>
		<Field className="input">
			<Input />
			<Svg
				width={20}
				viewBox="0 0 48 48"
			>{`<path d="M31 28h-2v-1c2-2 3-5 3-8a13 13 0 10-5 10h1v2l10 10 3-3-10-10zm-12 0a9 9 0 110-18 9 9 0 010 18z"/>`}</Svg>
		</Field>
		<IconButton
			$={(el, host) => onAction(el).tap(() => (host.opened = true))}
			className="button"
			flat
		>
			<Svg
				width={24}
				viewBox="0 0 48 48"
			>{`<path d="M31 28h-2v-1c2-2 3-5 3-8a13 13 0 10-5 10h1v2l10 10 3-3-10-10zm-12 0a9 9 0 110-18 9 9 0 010 18z"/>`}</Svg>
		</IconButton>
	</Host>
)
export class AppbarSearch extends Component {
	@Attribute()
	opened = false;
}
