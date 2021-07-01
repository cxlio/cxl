///<amd-module name="@cxl/ui/menu.js"/>
import { dom } from '@cxl/tsx';
import {
	Augment,
	Attribute,
	Component,
	StyleAttribute,
	get,
} from '@cxl/component';
import { css } from '@cxl/css';
import { ResetSurface } from './theme.js';
import { MenuIcon, IconButton } from './icon.js';
import { Toggle } from './core.js';

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
			...ResetSurface,
		},
		$dense: { paddingTop: 0, paddingBottom: 0 },
	}),
	() => <slot />
)
export class Menu extends Component {
	@StyleAttribute()
	dense = false;
}

/**
 *
 */
@Augment<MenuToggle>('cxl-menu-toggle', $ => (
	<Toggle right={get($, 'right')}>
		<IconButton slot="trigger">
			<MenuIcon />
		</IconButton>
		<Menu>
			<slot />
		</Menu>
	</Toggle>
))
export class MenuToggle extends Component {
	@Attribute()
	right = false;
}
