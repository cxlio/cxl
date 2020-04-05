import {
	StyleAttribute,
	Augment,
	Attribute,
	Component,
	Slot,
	attributeChanged,
	bind,
	get,
	role
} from '../component/index.js';
import { ButtonBase, Spinner, Toggle, Focusable, Svg } from './core.js';
import { dom, Host } from '../xdom/index.js';
import { onAction, triggerEvent } from '../template/index.js';
import { setAttribute, trigger } from '../dom/index.js';
import { Style } from '../css/index.js';
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
				translateY: -14
			},
			focusCirclePrimary: { backgroundColor: 'primary' },
			focusCircle$invalid$touched: { backgroundColor: 'error' },
			focusCircle$hover: {
				scaleX: 1,
				scaleY: 1,
				translateX: -14,
				translateY: -14,
				opacity: 0.14
			},
			focusCircle$focus: {
				scaleX: 1,
				scaleY: 1,
				translateX: -14,
				translateY: -14,
				opacity: 0.25
			},
			focusCircle$disabled: { scaleX: 0, scaleY: 0 }
		}}
	</Style>
);

@Augment<InputBase>(
	<Focusable />,
	bind(host => get(host, 'value').pipe(triggerEvent(host, 'change')))
)
class InputBase extends Component {
	@Attribute()
	value?: any;
	@StyleAttribute()
	invalid = false;
	@StyleAttribute()
	disabled = false;
	@StyleAttribute()
	touched = false;
	@StyleAttribute()
	focused = false;
	@Attribute()
	name?: string;
}

@Augment<Checkbox>(
	role('checkbox'),
	bind(host => {
		const update = tap<any>(
			() => (host.value = host.checked ? host.trueValue : host.falseValue)
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
				tap(val => (host.checked = val === host.trueValue))
			),
			get(host, 'checked').pipe(
				tap(val =>
					setAttribute(
						host,
						'aria-checked',
						host.indeterminate ? 'mixed' : val ? 'true' : 'false'
					)
				),
				update
			),
			get(host, 'trueValue').pipe(update),
			get(host, 'falseValue').pipe(update)
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
					lineHeight: 20
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
					color: 'transparent'
				},
				check: { display: 'none' },
				minus: { display: 'none' },
				check$checked: { display: 'initial' },
				check$indeterminate: { display: 'none' },
				minus$indeterminate: { display: 'initial' },
				box$checked: {
					borderColor: 'primary',
					backgroundColor: 'primary',
					color: 'onPrimary'
				},
				box$indeterminate: {
					borderColor: 'primary',
					backgroundColor: 'primary',
					color: 'onPrimary'
				},
				box$invalid$touched: { borderColor: 'error' },
				focusCircle: { top: -2, left: -2 }
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

	@StyleAttribute()
	checked = false;
	@StyleAttribute()
	indeterminate = false;
	@StyleAttribute()
	inline = false;

	@Attribute()
	trueValue: any = true;
	@Attribute()
	falseValue: any = false;
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
					height: 16
				},
				icon$disabled: { display: 'inline-block' }
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

@Augment(
	<Style>
		{{
			$: {
				display: 'block',
				lineHeight: 12,
				font: 'caption',
				verticalAlign: 'bottom',
				paddingTop: 8
			},
			$invalid: { color: 'error' }
		}}
	</Style>,
	<slot />
)
export class FieldHelp extends Component {
	static tagName = 'cxl-field-help';
	@StyleAttribute()
	invalid = false;
}

@Augment(
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
					display: 'block'
				},
				$focused: { borderColor: 'primary', color: 'primary' },
				$outline: {
					borderColor: 'onSurface',
					borderWidth: 1,
					borderStyle: 'solid',
					borderRadius: 4,
					marginTop: 2,
					paddingTop: 14,
					paddingBottom: 14
				},
				$focused$outline: {
					// boxShadow: '0 0 0 1px var(--cxl-primary)',
					borderColor: 'primary'
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
					backgroundColor: 'surface'
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
					verticalAlign: 'bottom'
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
					display: 'inline-block'
				},
				label$floating: {
					font: 'default',
					translateY: 23,
					opacity: 0.75
				},
				label$leading: { paddingLeft: 24 },
				label$floating$outline: { translateY: 27 }
			}}
		</Style>
		<div className="mask">
			<div className="label">
				<Slot selector="cxl-label-slot" />
			</div>
		</div>
		<div className="content">
			<Slot selector="cxl-field-content" />
		</div>
		<slot />
	</Host>
)
export class FieldBase extends Component {
	static tagName = 'cxl-field-base';

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
					position: 'relative'
				},
				focusCircle: { left: -4 }
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
				borderColor: 'onSurface'
			},
			$invalid: { borderColor: 'error' },
			line: {
				backgroundColor: 'primary',
				scaleX: 0,
				height: 2
			},
			line$focused: { scaleX: 1 },
			line$invalid: { backgroundColor: 'error' }
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
					display: 'block'
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
					marginTop: 3
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
					textAlign: 'center'
				},
				box$checked: { borderColor: 'primary' },
				box$invalid$touched: { borderColor: 'error' },
				box$checked$invalid$touched: { color: 'error' }
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
				transformOrigin: 'top'
			},
			$inline: {
				position: 'static',
				marginLeft: -16,
				marginRight: -16
			},
			$visible: {
				elevation: 3,
				overflowY: 'auto',
				backgroundColor: 'surface'
			}
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
					paddingBottom: 12
				},
				$inline: { display: 'inline-flex' },
				content: { flexGrow: 1 },
				switch: {
					position: 'relative',
					width: 46,
					height: 20,
					userSelect: 'none'
				},
				background: {
					position: 'absolute',
					display: 'block',
					left: 10,
					top: 2,
					height: 16,
					borderRadius: 8,
					width: 26,
					backgroundColor: 'divider'
				},

				knob: {
					width: 20,
					height: 20,
					borderRadius: 10,
					backgroundColor: 'surface',
					position: 'absolute',
					elevation: 1
				},

				background$checked: { backgroundColor: 'primaryLight' },
				knob$checked: {
					translateX: 24,
					backgroundColor: 'primary'
				},
				knob$invalid$touched: { backgroundColor: 'error' },
				content$invalid$touched: { color: 'error' },
				focusCircle$checked: { backgroundColor: 'primary' }
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
					host.value = val ? host.trueValue : host.falseValue;
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
	trueValue: any = true;
	@Attribute()
	falseValue: any = false;
}
