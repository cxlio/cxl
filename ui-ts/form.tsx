import {
	StyleAttribute,
	Augment,
	Attribute,
	Component,
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
	Focusable,
	Svg,
	ariaChecked,
	selectable,
	registable,
} from './core.js';
import { dom, Host } from '../xdom/index.js';
import {
	onAction,
	onValue,
	triggerEvent,
	keypress,
} from '../template/index.js';
import { trigger, on } from '../dom/index.js';
import { Style, padding } from '../css/index.js';
import { Observable, merge, tap } from '../rx/index.js';

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

@Augment<InputBase>(
	<Focusable />,
	bind(host =>
		merge(
			registable(host, 'form'),
			on(host, 'click').pipe(
				tap(ev => ev.target === host && ev.stopPropagation())
			),
			get(host, 'value').pipe(triggerEvent(host, 'change'))
		)
	)
)
class InputBase extends Component {
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
}

@Augment<Checkbox>(
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
			onAction(host).pipe(
				tap(ev => {
					if (host.disabled) return;
					if (host.indeterminate) {
						host.checked = false;
						host.indeterminate = false;
					} else host.checked = !host.checked;

					ev.preventDefault();
				})
			),
			attributeChanged(host, 'value').pipe(
				tap(val => (host.checked = val === host['true-value']))
			),
			get(host, 'checked').pipe(ariaChecked(host), update),
			get(host, 'indeterminate').pipe(update),
			get(host, 'true-value').pipe(update),
			get(host, 'false-value').pipe(update)
		);
	}),
	FocusCircleStyle,
	<Host>
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
	static tagName = 'cxl-checkbox';

	value: boolean | undefined = false;

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

@Augment<SubmitButton>(
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
	static tagName = 'cxl-submit';
	primary = true;
}

const FieldBase = (
	<Host>
		<Style>
			{{
				$: {
					position: 'relative',
					paddingLeft: 12,
					paddingRight: 12,
					paddingTop: 28,
					paddingBottom: 6,
					backgroundColor: 'surface',
					color: 'onSurface',
					display: 'block',
				},
				$focused: { borderColor: 'primary', color: 'primary' },
				$outline: {
					borderColor: 'onSurface',
					borderWidth: 1,
					borderStyle: 'solid',
					borderRadius: 4,
					marginTop: 2,
					paddingTop: 14,
					paddingBottom: 14,
				},
				$focused$outline: {
					// boxShadow: '0 0 0 1px var(--cxl-primary)',
					borderColor: 'primary',
				},
				$invalid: { color: 'error' },
				$invalid$outline: { borderColor: 'error' },
				$invalid$outline$focused: {
					// boxShadow: '0 0 0 1px var(--cxl-error)'
				},
				content: { position: 'relative' },
				mask: {
					position: 'absolute',
					top: 0,
					right: 0,
					left: 0,
					bottom: 0,
					backgroundColor: 'surface',
				},
				mask$outline: { borderRadius: 4 },
				mask$hover$hovered: {
					// state: 'hover'
				},
				// $disabled: { state: 'disabled' },
				// mask$hover$hovered$disabled: { state: 'none' },
				label: {
					position: 'absolute',
					top: 10,
					left: 12,
					font: 'caption',
					lineHeight: 10,
					verticalAlign: 'bottom',
					/*transition:
					'transform var(--cxl-speed), font-size var(--cxl-speed)'*/
				},
				label$focused: { color: 'primary' },
				label$invalid: { color: 'error' },
				label$outline: {
					top: -5,
					left: 8,
					paddingLeft: 4,
					paddingRight: 4,
					marginBottom: 0,
					backgroundColor: 'inherit',
					display: 'inline-block',
				},
				label$floating$novalue: {
					font: 'default',
					translateY: 23,
					opacity: 0.75,
				},
				label$leading: { paddingLeft: 24 },
				label$floating$novalue$outline: { translateY: 27 },
			}}
		</Style>
		<div className="mask">
			<div className="label">
				<Slot selector="cxl-label" />
			</div>
		</div>
		<div className="content">
			<slot />
		</div>
	</Host>
);

export class Label {
	static create() {
		return document.createElement('cxl-label');
	}
}

@Augment<Field>(
	<Style>
		{{
			$: { marginBottom: 16 },
			$outline: { paddingTop: 2 },
			flex: { display: 'flex', alignItems: 'center', lineHeight: 22 },
			line: { position: 'absolute', marginTop: 6, left: 0, right: 0 },
			line$outline: { display: 'none' },
			help: { paddingLeft: 12, paddingRight: 12, display: 'flex' },
			grow: { flexGrow: 1 },
			counter: { textAlign: 'right' },
			help$leading: { paddingLeft: 38 },
		}}
	</Style>,
	FieldBase,
	render(host => {
		let input: InputBase;

		function onRegister(ev: Event) {
			if (ev.target) input = ev.target as InputBase;
		}

		function update(ev: any) {
			if (input) {
				console.log(ev);
				host.disabled = input.disabled;
				if (ev.type === 'focusable.focus') host.focused = true;
				else if (ev.type === 'focusable.blur') host.focused = false;

				if (input.touched) {
					host.invalid = input.invalid;
					// this.error = el.$validity && el.$validity.message;
				}
			}
		}

		function onChange() {
			const value = input?.value;
			host.novalue = !value;
		}

		const hostBindings = merge(
			on(host, 'form.register').pipe(tap(onRegister)),
			on(host, 'focusable.touched').pipe(tap(update)),
			on(host, 'focusable.focus').pipe(tap(update)),
			on(host, 'focusable.blur').pipe(tap(update)),
			on(host, 'invalid').pipe(tap(update)),
			on(host, 'input').pipe(tap(onChange)),
			on(host, 'form.disabled').pipe(tap(update)),
			on(host, 'click').pipe(tap(() => input?.focus()))
		);

		return (
			<Host $={() => hostBindings}>
				<FocusLine
					className="line"
					focused={get(host, 'focused')}
					invalid={get(host, 'invalid')}
				/>
				<div className="help">
					<div className="grow">
						<Slot selector="cxl-field-help" />
						<div title="=error:text:show"></div>
					</div>
				</div>
			</Host>
		);
	})
)
export class Field extends Component {
	static tagName = 'cxl-field';

	@StyleAttribute()
	outline = false;
	@StyleAttribute()
	floating = false;
	@StyleAttribute()
	invalid = false;
	@StyleAttribute()
	focused = false;
	@StyleAttribute()
	leading = false;
	@StyleAttribute()
	disabled = false;
	@StyleAttribute()
	hovered = false;
	@StyleAttribute()
	novalue = true;
}

@Augment(
	<Style>
		{{
			$: {
				display: 'block',
				lineHeight: 12,
				font: 'caption',
				verticalAlign: 'bottom',
				paddingTop: 8,
			},
			$invalid: { color: 'error' },
		}}
	</Style>,
	<slot />
)
export class FieldHelp extends Component {
	static tagName = 'cxl-field-help';
	@StyleAttribute()
	invalid = false;
}

/*	component(
		{
			update(ev) {
				var el = ev.target;

				if (el.touched) {
					this.invalid = el.invalid;
					this.error = el.$validity && el.$validity.message;
				}
			}
		}
	);*/
/*@Augment(
	<Host>
		<Style>{{
				$: { marginBottom: 16 },
					content: { display: 'block', marginTop: 16 },
						content$outline: { marginTop: 0 }
		}}</Style>
		<FieldBase &="on(invalid):#update =invalid:@invalid =outline:@outline">
			<LabelSlot><Slot selector="cxl-label" /></LabelSlot>
			<FieldContent><slot /></FieldContent>
		</FieldBase>
		<div className="help">
			<FieldHelp invalid &="=error:text:show"></FieldHelp>
			<div &="=error:hide content(cxl-field-help)"></div>
		</div>
	</Host>
)
export class Fieldset extends Component {
	static tagName = 'cxl-fieldset';
	
	@StyleAttribute()
	outline = false;
	
	invalid = false;
}*/

@Augment(
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
export class FieldToggle extends Component {
	static tagName = 'cxl-field-toggle';
}

@Augment(
	<Style>
		{{
			$: {
				position: 'absolute',
				left: 0,
				right: 0,
				height: 2,
				borderWidth: 0,
				borderBottom: 1,
				borderStyle: 'solid',
				borderColor: 'onSurface',
			},
			$invalid: { borderColor: 'error' },
			line: {
				backgroundColor: 'primary',
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
	static tagName = 'cxl-focus-line';

	@StyleAttribute()
	focused = false;

	@StyleAttribute()
	invalid = false;

	@StyleAttribute()
	touched = false;
}

@Augment<Form>(
	role('form'),
	bind(host =>
		merge(
			keypress(host, 'enter').pipe(
				tap(ev => {
					host.submit();
					ev.preventDefault();
				})
			)
		)
	),
	<slot />
)
export class Form extends Component {
	static tagName = 'cxl-form';

	@Attribute()
	autocomplete = 'off';

	readonly elements?: InputBase[];

	submit() {
		if (this.elements) {
			let focus: InputBase | undefined;

			this.elements.forEach(el => {
				if (el.invalid) focus = focus || el;

				el.touched = true;
			});

			if (focus) focus.focus();
		}
	}
}

@Augment<Input>(
	role('textbox'),
	<Host>
		<Style>
			{{
				$: {
					flexGrow: 1,
					height: 22,
					font: 'default',
					borderWidth: 0,
					...padding(0),
					backgroundColor: 'transparent',
					marginTop: 0,
					color: 'onSurface',
					width: '100%',
					lineHeight: 22,
					textAlign: 'inherit',
					borderRadius: 0,
					outline: 0,
					display: 'block',
				},
			}}
		</Style>
		<slot />
	</Host>,
	bind(host => {
		return merge(
			get(host, 'disabled').pipe(
				tap(val => (host.contentEditable = val ? 'false' : 'true'))
			),
			on(host, 'input').pipe(
				tap(() => {
					host.value = host.innerText;
				})
			)
		);
	})
	/*render(host => (
		<input
			$={el => {
				host.inputElement = el;
				return merge(
					onValue(el).pipe(tap(val => (host.value = val))),
					on(el, 'focus').pipe(triggerEvent(host, 'focus')),
					on(el, 'blur').pipe(triggerEvent(host, 'blur'))
				);
			}}
			type={host.type}
			className="input"
			value={get(host, 'value')}
			maxLength={
				get(host, 'maxlength').pipe(
					filter(val => val !== undefined)
				) as Observable<number>
			}
			disabled={get(host, 'disabled')}
		/>
	))*/
)
export class Input extends InputBase {
	static tagName = 'cxl-input';
	readonly type: string = 'text';

	inputElement?: HTMLInputElement;

	@Attribute()
	maxlength?: number;

	value: string = '';

	focus() {
		this.inputElement?.focus();
	}
}

@Augment<Option>(
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
					display: 'inline-block',
					width: 20,
					height: 20,
					borderWidth: 2,
					borderColor: 'onSurface',
					marginRight: 12,
					lineHeight: 16,
					borderStyle: 'solid',
					color: 'transparent',
				},
				box$selected: {
					borderColor: 'primary',
					backgroundColor: 'primary',
					color: 'onPrimary',
				},
				checkbox: { marginBottom: 0, marginRight: 8 },
				content: { flexGrow: 1 },
				// $hover: { state: 'hover' },
				// $focused: { state: 'focus' },
				$selected: {
					backgroundColor: 'primaryLight',
					color: 'onPrimaryLight',
				},
				// $disabled: { state: 'disabled' },
				$inactive: {
					backgroundColor: 'transparent',
					color: 'onSurface',
				},
			}}
		</Style>
		<div className="content">
			<slot />
		</div>
	</Host>
)
export class Option extends Component {
	static tagName = 'cxl-option';

	@Attribute()
	value?: any;

	@StyleAttribute()
	selected = false;

	@StyleAttribute()
	focused = false;

	@StyleAttribute()
	disabled = false;

	@StyleAttribute()
	inactive = false;
}

@Augment()
export class PasswordInput extends Input {
	static tagName = 'cxl-password';
	readonly type = 'password';
}

const radioElements = new Set<Radio>();

@Augment<Radio>(
	role('radio'),
	FocusCircleStyle,
	<Host>
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
			new Observable(() => unregister),
			onAction(host).pipe(
				tap(() => {
					if (host.disabled) return;
					if (!host.checked) host.checked = host.touched = true;
				})
			),
			get(host, 'name').pipe(tap(register)),
			get(host, 'checked').pipe(
				tap(val => {
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
			)
		);
	})
)
export class Radio extends InputBase {
	static tagName = 'cxl-radio';
	@StyleAttribute()
	checked = false;
}

@Augment(
	<Style>
		{{
			$: {
				position: 'absolute',
				elevation: 0,
				right: -16,
				left: -16,
				overflowY: 'hidden',
				transformOrigin: 'top',
			},
			$inline: {
				position: 'static',
				marginLeft: -16,
				marginRight: -16,
			},
			$visible: {
				elevation: 3,
				overflowY: 'auto',
				backgroundColor: 'surface',
			},
		}}
	</Style>,
	<slot />
)
export class SelectMenu extends Component {
	static tagName = 'cxl-select-menu';

	@StyleAttribute()
	visible = false;

	@StyleAttribute()
	inline = false;
}

@Augment<Switch>(
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
		<slot />
		<div className="switch">
			<span className="background =checked:#update"></span>
			<div className="knob">
				<span className="focusCircle"></span>
			</div>
		</div>
	</Host>,
	bind(host => {
		return merge(
			onAction(host).pipe(
				tap(() => {
					if (host.disabled) return;
					host.checked = !host.checked;
				})
			),
			get(host, 'checked').pipe(
				tap(val => {
					host.setAttribute('aria-checked', val ? 'true' : 'false');
					host.value = val ? host['true-value'] : host['false-value'];
				})
			)
		);
	})
)
export class Switch extends InputBase {
	static tagName = 'cxl-switch';

	value = false;
	@StyleAttribute()
	checked = false;
	@Attribute()
	'true-value': any = true;
	@Attribute()
	'false-value': any = false;
}

@Augment<TextArea>(
	role('textarea'),
	<Host>
		<Style>
			{{
				$: { position: 'relative', flexGrow: 1 },
				input: {
					font: 'default',
					backgroundColor: 'transparent',
					lineHeight: 20,
					borderWidth: 0,
					paddingLeft: 0,
					paddingRight: 0,
					paddingTop: 1,
					color: 'onSurface',
					paddingBottom: 1,
				},
				textarea: {
					width: '100%',
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					height: '100%',
					outline: 0,
					borderRadius: 0,
					marginTop: 0,
				},
				measure: { opacity: 0, whiteSpace: 'pre-wrap' },
			}}
		</Style>
		<div className="input measure"></div>
	</Host>,
	render(host => (
		<textarea
			className="input textarea"
			$={el =>
				onValue(el).pipe(
					tap(val => {
						host.value = val;
						// calculateHeight
						// =aria-label:attribute(aria-label)
					})
				)
			}
			value={get(host, 'value')}
			disabled={get(host, 'disabled')}
		/>
	))
)
export class TextArea extends InputBase {
	static tagName = 'cxl-textarea';
	value: string = '';
}
