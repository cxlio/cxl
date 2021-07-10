///<amd-module name="@cxl/ui/navigation.js"/>
import { dom } from '@cxl/tsx';
import {
	Augment,
	Attribute,
	Component,
	StyleAttribute,
	get,
} from '@cxl/component';
import { onAction } from '@cxl/dom';
import { navigationList, role } from '@cxl/template';
import { css } from '@cxl/css';
import { EMPTY } from '@cxl/rx';
import { ResetSurface } from './theme.js';
import { MenuIcon, IconButton } from './icon.js';
import { Drawer } from './dialog.js';

/**
 * Navigation drawers provide access to destinations in your app.
 * @demo
 * <cxl-appbar>
 *   <cxl-navbar></cxl-navbar>
 *   <cxl-appbar-title>Appbar with Navbar</cxl-appbar-title>
 * </cxl-appbar>
 */
@Augment<Navbar>(
	'cxl-navbar',
	role('navigation'),
	css({
		$: {
			display: 'inline-block',
			overflowScrolling: 'touch',
			font: 'default',
		},
		toggler: {
			backgroundColor: 'surface',
			color: 'onSurface',
			cursor: 'pointer',
			marginLeft: -8,
			marginRight: 16,
		},
		drawer: ResetSurface,
		'@large': {
			toggler$permanent: { display: 'none' },
		},
	}),
	host => (
		<>
			<IconButton
				$={el =>
					onAction(el).tap(() => {
						if (host.drawer)
							host.drawer.visible = !host.drawer.visible;
					})
				}
				className="toggler"
			>
				<MenuIcon />
			</IconButton>
			<Drawer
				className="drawer"
				$={el => ((host.drawer = el), EMPTY)}
				permanent={get(host, 'permanent')}
			>
				<slot />
			</Drawer>
		</>
	)
)
export class Navbar extends Component {
	@StyleAttribute()
	permanent = false;

	@Attribute()
	drawer?: Drawer;
}

/**
 * Lists are continuous, vertical indexes of text or images.
 * @demo
 * <cxl-list>
 *   <cxl-item><cxl-avatar></cxl-avatar> One Line Item</cxl-item>
 *   <cxl-item><cxl-avatar></cxl-avatar> One Line Item</cxl-item>
 *   <cxl-item><cxl-avatar></cxl-avatar> One Line Item</cxl-item>
 * </cxl-list>
 */
@Augment<List>(
	'cxl-list',
	role('list'),
	$ =>
		navigationList(
			$,
			':not([disabled])',
			':focus, :focus-within'
		).tap((el: any) => el?.focus?.()),
	css({
		$: {
			display: 'block',
			paddingTop: 8,
			paddingBottom: 8,
		},
	}),
	_ => <slot />
)
export class List extends Component {}
