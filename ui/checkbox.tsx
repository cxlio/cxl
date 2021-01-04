import { dom } from '@cxl/tsx';
import {
	Augment,
	Attribute,
	StyleAttribute,
	bind,
	get,
	role,
	staticTemplate,
} from '@cxl/component';
import { Focusable, Svg, ariaChecked } from './core.js';
import { tap, merge } from '@cxl/rx';
import { FocusCircleStyle, InputBase } from './input-base.js';
import { onAction } from '@cxl/dom';
import { Style } from '@cxl/template';

const Undefined = {};

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
	Focusable,
	staticTemplate(() => (
		<>
			<Style>
				{{
					$: {
						font: 'default',
						position: 'relative',
						cursor: 'pointer',
						paddingTop: 12,
						paddingBottom: 12,
						display: 'block',
						paddingLeft: 36,
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
		</>
	))
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
