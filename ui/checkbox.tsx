///<amd-module name="@cxl/ui/checkbox.js"/>
import { dom } from '@cxl/tsx';
import { Augment, StyleAttribute, get } from '@cxl/component';
import { Svg, Path } from './core.js';
import { merge } from '@cxl/rx';
import { Focusable, FocusCircleStyle } from './core.js';
import { InputBase } from './input-base.js';
import { onAction } from '@cxl/dom';
import { checkedBehavior, role, staticTemplate } from '@cxl/template';
import { padding } from '@cxl/css';
import { css } from './theme.js';

/**
 * Checkboxes allow the user to select one or more items from a set. Checkboxes can be used to turn an option on or off.
 * @example
 * <cxl-checkbox checked>Checkbox Label</cxl-checkbox>
 */
@Augment<Checkbox>(
	'cxl-checkbox',
	role('checkbox'),
	host => {
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
			checkedBehavior(host).tap(update),
			get(host, 'indeterminate').tap(update)
		);
	},
	FocusCircleStyle,
	Focusable,
	css({
		$: {
			position: 'relative',
			cursor: 'pointer',
			...padding(10, 0, 10, 46),
			lineHeight: 20,
			marginLeft: -10,
			display: 'block',
			verticalAlign: 'middle',
			font: 'default',
			textAlign: 'left',
		},
		$inline: {
			display: 'inline-block',
		},
		$empty: {
			display: 'inline-block',
			...padding(0),
			marginLeft: 0,
			width: 20,
			height: 20,
		},
		$invalid$touched: { color: 'error' },
		box$empty: {
			left: 0,
		},
		box: {
			left: 10,
			width: 20,
			height: 20,
			borderWidth: 2,
			lineHeight: 16,
			borderColor: 'onSurface',
			borderStyle: 'solid',
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
	}),
	staticTemplate(() => (
		<>
			<div className="box">
				<span className="focusCircle focusCirclePrimary" />
				<Svg className="check" viewBox="0 0 24 24">
					<Path
						style="stroke-width:4;fill:currentColor;stroke:currentColor"
						d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
					/>
				</Svg>
				<Svg className="minus" viewBox="0 0 24 24">
					<Path
						style="stroke-width:4;fill:currentColor;stroke:currentColor"
						d="M19 13H5v-2h14v2z"
					/>
				</Svg>
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
