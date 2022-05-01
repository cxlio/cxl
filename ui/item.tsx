///<amd-module name="@cxl/ui/item.js"/>
//import { dom } from '@cxl/tsx';
import { Augment, Component, Slot, StyleAttribute } from '@cxl/component';
import { onAction } from '@cxl/dom';
import { focusable, triggerEvent } from '@cxl/template';
import { FocusStyles, HoverStyles, StateStyles, css } from './theme.js';
import { ripple } from './core.js';

@Augment<ItemLayout>(
	'cxl-item-layout',
	css({
		$: {
			position: 'relative',
			color: 'onSurface',
			backgroundColor: 'surface',
			display: 'flex',
			font: 'default',
			lineHeight: 24,
			paddingRight: 16,
			paddingLeft: 16,
			paddingTop: 8,
			paddingBottom: 8,
			minHeight: 48,
			alignItems: 'center',
			columnGap: 16,
		},
		$selected: {
			backgroundColor: 'primaryLight',
			color: 'onPrimaryLight',
		},
		$hover: HoverStyles,
	}),
	Slot
)
export class ItemLayout extends Component {
	@StyleAttribute()
	selected = false;
}

@Augment<Item>(
	'cxl-item',
	ripple,
	focusable,
	css({
		$focusWithin: FocusStyles,
		...StateStyles,
	}),
	host => onAction(host).pipe(triggerEvent(host, 'drawer.close'))
)
export class Item extends ItemLayout {
	@StyleAttribute()
	disabled = false;

	touched = false;
}
