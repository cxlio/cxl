///<amd-module name="@cxl/ui/field.js"/>
import {
	StyleAttribute,
	Augment,
	Attribute,
	Component,
	get,
} from '@cxl/component';
import { InputBase } from './input-base.js';
import { dom, expression } from '@cxl/tsx';
import { on, setAttribute } from '@cxl/dom';
import { boxShadow, padding } from '@cxl/css';
import { EMPTY, be, observable, merge } from '@cxl/rx';
import { css } from './theme.js';

const FieldBase = [
	css({
		$: {
			color: 'onSurface',
			position: 'relative',
			display: 'block',
			gridColumnEnd: 'span 12',
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
			minHeight: 13,
			verticalAlign: 'bottom',
		},
		label$focusWithin: { color: 'primary' },
		label$invalid: { color: 'error' },
		label$outline: {
			position: 'absolute',
			translateY: -17,
			paddingTop: 0,
			height: 5,
			minHeight: 'auto',
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

@Augment<Fieldset>(
	'cxl-fieldset',
	...FieldBase,
	host =>
		merge(on(host, 'invalid'), on(host, 'form.register')).tap(ev => {
			const target = ev.target as InputBase;
			if (target)
				setAttribute(host, 'invalid', target.touched && target.invalid);
		}),
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

/**
 * @example
 * <cxl-field>
 *   <cxl-label>Form Field</cxl-label>
 *   <cxl-input></cxl-input>
 *   <cxl-field-help>Field Help Text</cxl-field-help>
 * </cxl-field>
 */
@Augment<Field>(
	'cxl-field',
	css({
		$: { textAlign: 'left' },
		// line: { position: 'relative', left: -12, right: -12 },
		line$outline: { display: 'none' },
		help: {
			font: 'caption',
			position: 'relative',
			display: 'flex',
			flexGrow: 1,
			paddingLeft: 12,
			paddingRight: 12,
		},
		help$leading: { paddingLeft: 38 },
		invalidMessage: { display: 'none', paddingTop: 4 },
		invalidMessage$invalid: { display: 'block' },
		$inputdisabled: {
			filter: 'saturate(0)',
			opacity: 0.6,
			pointerEvents: 'none',
		},
		label$dense: { paddingTop: 5 },
		content$dense: { marginTop: 0 },
		container$dense: { paddingBottom: 3 },
		label$floating$novalue$dense: { translateY: 17 },
		label$dense$outline: { translateY: -13 },
		label$floating$novalue$outline$dense: { translateY: 7 },
		content$dense$outline: { marginTop: 2 },
		container$dense$outline: { paddingTop: 8, paddingBottom: 8 },
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
				host.toggleAttribute('inputdisabled', input.disabled);
				host.toggleAttribute('invalid', invalid.value);
				if (invalid.value) invalidMessage.next(input.validationMessage);
				if (!ev) return;
				if (ev.type === 'focusable.focus') focused.next(true);
				else if (ev.type === 'focusable.blur') focused.next(false);
			}
		}

		function onChange() {
			const value = host.input?.value;
			host.toggleAttribute('novalue', !value || value.length === 0);
		}

		host.bind(
			merge(
				get(host, 'input').switchMap(input =>
					input
						? merge(
								observable(() => update()),
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
	/**
	 * @example
	 * <cxl-field outline>
	 *   <cxl-label>Form Field</cxl-label>
	 *   <cxl-input></cxl-input>
	 *   <cxl-field-help>Field Help Text</cxl-field-help>
	 * </cxl-field>
	 */
	@StyleAttribute()
	outline = false;
	@StyleAttribute()
	floating = false;
	@StyleAttribute()
	leading = false;
	/**
	 * @example
	 * <cxl-field dense>
	 *   <cxl-label>Form Field</cxl-label>
	 *   <cxl-input></cxl-input>
	 *   <cxl-field-help>Field Help Text</cxl-field-help>
	 * </cxl-field>
	 */
	@StyleAttribute()
	dense = false;
	@Attribute()
	input?: InputBase;
}
