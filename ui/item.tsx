///<amd-module name="@cxl/ui/item.js"/>
import { dom } from '@cxl/tsx';
import { Augment, Component, StyleAttribute } from '@cxl/component';
import { onAction } from '@cxl/dom';
import { StateStyles, focusable, triggerEvent } from '@cxl/template';
import { css } from '@cxl/css';
import { ripple } from './core.js';

@Augment<Item>(
	'cxl-item',
	ripple,
	focusable,
	css({
		$: {
			display: 'flex',
			position: 'relative',
			color: 'onSurface',
			font: 'default',
			lineHeight: 24,
			paddingRight: 16,
			paddingLeft: 16,
			paddingTop: 8,
			paddingBottom: 8,
			minHeight: 48,
			alignItems: 'center',
			backgroundColor: 'surface',
			columnGap: 16,
		},
		$selected: {
			backgroundColor: 'primaryLight',
			color: 'onPrimaryLight',
		},
		...StateStyles,
	}),
	host => onAction(host).pipe(triggerEvent(host, 'drawer.close')),
	_ => <slot />
)
export class Item extends Component {
	@StyleAttribute()
	disabled = false;

	touched = false;

	@StyleAttribute()
	selected = false;
}
