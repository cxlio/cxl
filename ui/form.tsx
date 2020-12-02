import {
	StyleAttribute,
	Augment,
	Attribute,
	Component,
	Slot,
	bind,
	get,
	role,
	staticTemplate,
} from '../component/index.js';
import {
	ButtonBase,
	DisabledStyles,
	Spinner,
	Span,
	Toggle,
	FocusHighlight,
	Focusable,
	IconButton,
	Svg,
	aria,
	ariaValue,
	focusDelegate,
	focusable,
	navigationList,
	registableHost,
	selectableHost,
} from './core.js';
import { dom, expression } from '../tsx/index.js';
import {
	onValue,
	syncAttribute,
	triggerEvent,
	teleport,
} from '../template/index.js';
import {
	trigger,
	onKeypress,
	on,
	onAction,
	setAttribute,
} from '../dom/index.js';
import { border, css, boxShadow, padding } from '../css/index.js';
import { EMPTY, Observable, be, defer, merge } from '../rx/index.js';
import { dragInside } from '../drag/index.js';
import { FocusCircleStyle, Undefined, InputBase } from './input-base.js';
import { Option, SelectMenu, SelectBase } from './select.js';
import { Appbar, AppbarContextual } from './navigation.js';

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
		focusCircle: { marginLeft: -4, marginTop: -8 },
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
	bind(el => onAction(el).pipe(triggerEvent(el, 'form.submit')))
)
export class SubmitButton extends ButtonBase {
	primary = true;
}

const FieldBase = [
	css({
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
	}),
	($: any) => (
		<div className="container">
			<div className="mask"></div>
			<div className="label">
				<$.Slot selector="cxl-label" />
			</div>
			<div className="content">
				<slot />
			</div>
		</div>
	),
];

function fieldInput<T extends Component>(host: T) {
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
	css({
		$: {
			display: 'inline-block',
			paddingLeft: 4,
			paddingRight: 4,
		},
	}),
	Slot,
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
	css({
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
	}),
	...FieldBase,
	host => {
		const invalid = be(false);
		const focused = be(false);
		const invalidMessage = be('');

		function onRegister(ev: Event) {
			if (ev.target) {
				host.input = ev.target as InputBase;
				onChange();
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

		host.bind(
			merge(
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
			)
		);

		return (
			<host.Shadow>
				<FocusLine
					className="line"
					focused={focused}
					invalid={invalid}
				/>
				<div className="help">
					<host.Slot selector="cxl-field-help" />
					<div className="invalidMessage">
						{expression(host, invalidMessage)}
					</div>
				</div>
			</host.Shadow>
		);
	}
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
	css({
		$: {
			display: 'block',
			lineHeight: 12,
			paddingTop: 4,
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

@Augment<Fieldset>(
	'cxl-fieldset',
	...FieldBase,
	bind(host =>
		merge(on(host, 'invalid'), on(host, 'form.register')).tap(ev => {
			const target = ev.target as InputBase;
			if (target)
				setAttribute(host, 'invalid', target.touched && target.invalid);
		})
	),
	css({
		$: { marginBottom: 16 },
		mask: { display: 'none' },
		content: { display: 'block', marginTop: 16 },
		content$outline: { marginTop: 0, marginBottom: 0 },
	})
)
export class Fieldset extends Component {
	@StyleAttribute()
	outline = true;
}

@Augment(
	'cxl-field-toggle',
	FocusCircleStyle,
	css({
		$: {
			paddingTop: 8,
			paddingBottom: 8,
			paddingLeft: 12,
			paddingRight: 12,
			cursor: 'pointer',
			position: 'relative',
		},
		focusCircle: { left: -4 },
	}),
	_ => (
		<>
			<span className="focusCircle focusCirclePrimary"></span>
			<Toggle>
				<slot />
			</Toggle>
		</>
	)
)
export class FieldToggle extends Component {}

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

@Augment(
	'cxl-focus-line',
	css({
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
	}),
	_ => <div className="line" />
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
	Slot
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
	bind(host => onKeypress(host, 'enter').tap(ev => ev.preventDefault())),
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
	$ => ContentEditable($)
)
export class Input extends InputBase {
	value = '';
}

function ContentEditable<T extends InputBase>(host: T) {
	const el = <div className="input" />;
	host.bind($contentEditable(el as any, host));
	return el;
}

@Augment<FieldInput>(
	'cxl-field-input',
	role('textbox'),
	bind(host => onKeypress(host, 'enter').tap(ev => ev.preventDefault())),
	css({
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
export class FieldTextArea extends InputBase {
	@Attribute()
	outline = false;

	@Attribute()
	floating = false;

	@Attribute()
	label = '';
}

/**
 * @example
 * <cxl-field floating>
 *   <cxl-label>Email Address</cxl-label>
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
 * <cxl-radio name="test" value="1">Radio Button 1</cxl-radio>
 * <cxl-radio name="test" value="2" checked>Radio Button 2</cxl-radio>
 * <cxl-radio name="test" value="3">Radio Button 3</cxl-radio>
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

/**
 * A form input component that allows the user to select multiple option from a dropdown list
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
	css({
		menu: { left: -12, right: -12, top: 26, height: 0 },
		menu$opened: { height: 'auto' },
	}),
	host => (
		<SelectMenu
			$={el => get(host, 'opened').raf(() => host.positionMenu(el))}
			className="menu"
			visible={get(host, 'opened')}
		>
			<slot />
		</SelectMenu>
	),
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
	host => (
		<div className="placeholder">
			{expression(host, host.selectedText$)}
		</div>
	)
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

function $valueProxy<T extends InputBase>(host: T, el: HTMLInputElement) {
	host.bind(
		merge(
			$focusProxy(el, host),
			get(host, 'value').tap(val => {
				if (el.value !== val) el.value = val;
			}),
			get(host, 'disabled').tap(val => (el.disabled = val)),
			onValue(el).tap(() => (host.value = el.value))
		)
	);
	return el;
}

function $contentEditable<T extends InputBase>(el: HTMLElement, host: T) {
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
 * Text fields let users enter and edit text that spans in multiple lines.
 * @example
 * <cxl-field>
 *   <cxl-label>Prefilled Text Area</cxl-label>
 *   <cxl-textarea value="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."></cxl-textarea>
 * </cxl-field>
 */
@Augment<TextArea>(
	'cxl-textarea',
	role('textarea'),
	css({
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
	}),
	$ => ContentEditable($)
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
	Focusable,
	css({
		$: {
			display: 'inline-block',
			elevation: 2,
			backgroundColor: 'secondary',
			color: 'onSecondary',
			borderRadius: 56,
			textAlign: 'center',
			paddingTop: 20,
			cursor: 'pointer',
			font: 'h6',
			paddingBottom: 20,
			lineHeight: 16,
			width: 56,
		},
		'@small': { $fixed: { bottom: 'auto', top: 32 } },
		$fixed: {
			position: 'fixed',
			height: 56,
			bottom: 16,
			right: 24,
		},
		$focus: { elevation: 4 },
	}),
	css(FocusHighlight),
	Slot
)
export class Fab extends Component {
	@StyleAttribute()
	disabled = false;
	@StyleAttribute()
	fixed = false;

	touched = false;
}

const SearchIcon = staticTemplate(() => (
	<Svg
		width={24}
		viewBox="0 0 48 48"
	>{`<path d="M31 28h-2v-1c2-2 3-5 3-8a13 13 0 10-5 10h1v2l10 10 3-3-10-10zm-12 0a9 9 0 110-18 9 9 0 010 18z"/>`}</Svg>
));

/**
 * @demo
 * <cxl-appbar>
 *   <cxl-appbar-title>Appbar Title</cxl-appbar-title>
 *   <cxl-appbar-search></cxl-appbar-search>
 * </cxl-appbar>
 * @beta
 * @see Appbar
 */
@Augment<AppbarSearch>(
	'cxl-appbar-search',
	css({
		$: { display: 'flex', position: 'relative' },
		$opened: {
			backgroundColor: 'surface',
		},
		input: { display: 'none', marginBottom: 0, position: 'relative' },
		input$opened: {
			display: 'block',
		},
		button$opened: { display: 'none' },
		'@medium': {
			input: {
				width: 200,
				display: 'block',
			},
			button: { display: 'none' },
		},
		$disabled: DisabledStyles,
	}),
	$ => {
		let inputEl: Input;

		function onContextual(val: boolean) {
			if (val) requestAnimationFrame(() => inputEl.focus());
		}

		return teleport(
			<AppbarContextual
				$={el => get(el, 'visible').tap(onContextual)}
				name="search"
			>
				<Field className="input">
					<Input
						$={el => syncAttribute($, (inputEl = el), 'value')}
					/>
					<SearchIcon />
				</Field>
			</AppbarContextual>,
			'cxl-appbar'
		);
	},
	host => {
		return (
			<>
				<IconButton
					$={el =>
						merge(
							onAction((host.mobileIcon = el)).tap(() =>
								host.open()
							),
							on(el, 'blur').tap(() => (host.touched = true))
						)
					}
					className="button"
				>
					<SearchIcon />
				</IconButton>
				<Field className="input">
					<Input
						$={el =>
							merge(
								syncAttribute(host, el, 'value'),
								focusDelegate(host, (host.desktopInput = el))
							)
						}
					/>
					<SearchIcon />
				</Field>
			</>
		);
	}
)
export class AppbarSearch extends InputBase {
	@StyleAttribute()
	opened = false;

	protected desktopInput?: Input;
	protected mobileIcon?: IconButton;

	value = '';

	open() {
		const appbar: Appbar | null = this.parentElement as Appbar;
		if (appbar) appbar.contextual = 'search';
	}

	focus() {
		if (this.desktopInput?.offsetParent) this.desktopInput.focus();
		else if (this.mobileIcon?.offsetParent) this.mobileIcon.focus();
	}
}
