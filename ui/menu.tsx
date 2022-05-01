///<amd-module name="@cxl/ui/menu.js"/>
import { dom } from '@cxl/tsx';
import {
	Augment,
	Component,
	StyleAttribute,
	Attribute,
	get,
} from '@cxl/component';
import { on } from '@cxl/dom';
import { BaseColors, css } from './theme.js';
import { MoreVertIcon, IconButton } from './icon.js';
import { Toggle } from './core.js';
import { Popup, PopupPosition } from './dialog.js';

/*
 * Menus display a list of choices on temporary surfaces.
 * @example
 * <cxl-menu>
 *   <cxl-item disabled>Option disabled</cxl-item>
 *   <cxl-item selected>Option Selected</cxl-item>
 *   <cxl-item>Option 2</cxl-item>
 *   <cxl-hr></cxl-hr>
 *   <cxl-item>Option 3</cxl-item>
 * </cxl-menu>
 */
@Augment(
	'cxl-menu',
	css({
		$: {
			elevation: 1,
			display: 'inline-block',
			backgroundColor: 'surface',
			overflowY: 'auto',
			color: 'onSurface',
			paddingTop: 8,
			paddingBottom: 8,
			minWidth: 112,
			width: 'max-content',
			variables: BaseColors,
		},
		$dense: { paddingTop: 0, paddingBottom: 0 },
	}),
	() => <slot />
)
export class Menu extends Component {
	@StyleAttribute()
	dense = false;
}

@Augment<MenuPopup>(
	'cxl-menu-popup',
	css({
		$: { animation: 'fadeIn' },
		$out: { animation: 'fadeOut' },
	}),
	$ => on($, 'click').tap(ev => ev.stopPropagation()),
	() => (
		<Menu>
			<slot />
		</Menu>
	)
)
export class MenuPopup extends Component {}

/**
 *
 */
@Augment<MenuToggle>('cxl-menu-toggle', $ => {
	const popup = (
		<Popup
			container="cxl-menu-popup"
			proxy={$}
			position={get($, 'position')}
		/>
	) as Popup;
	$.target = popup;

	return (
		<IconButton>
			<MoreVertIcon />
			{popup}
		</IconButton>
	);
})
export class MenuToggle extends Toggle {
	@Attribute()
	position: PopupPosition = 'auto';
}
