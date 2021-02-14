///<amd-module name="@cxl/ui/checkbox.js"/>
import { dom } from '@cxl/tsx';
import {
	Augment,
	StyleAttribute,
	bind,
	get,
	staticTemplate,
} from '@cxl/component';
import { Svg } from './core.js';
import { merge } from '@cxl/rx';
import { FocusCircleStyle, InputBase } from './input-base.js';
import { onAction } from '@cxl/dom';
import { Focusable, Style, checkedBehavior, role } from '@cxl/template';

/**
 * Checkboxes allow the user to select one or more items from a set. Checkboxes can be used to turn an option on or off.
 * @example
 * <cxl-checkbox>Checkbox Label</cxl-checkbox>
 * <cxl-checkbox checked>Checkbox Label</cxl-checkbox>
 * <cxl-checkbox indeterminate>Checkbox Indeterminate</cxl-checkbox>
 */
@Augment<Checkbox>(
	'cxl-checkbox',
	role('checkbox'),
	bind(host => {
		const update = () =>
			(host.value = host.indeterminate ? undefined : host.checked);

		return merge(
			onAction(host).tap(ev => {
				if (host.disabled) return;
				if (host.indeterminate) {
					host.checked = false;
					host.indeterminate = false;
				} else host.checked = !host.checked;

				ev.preventDefault();
			}),
			checkedBehavior(host, update),
			get(host, 'indeterminate').tap(update)
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
						textAlign: 'left',
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
	value: boolean | undefined = false;

	@StyleAttribute()
	checked = false;
	@StyleAttribute()
	indeterminate = false;
	@StyleAttribute()
	inline = false;
}
