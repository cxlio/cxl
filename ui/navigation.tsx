import { dom } from '../tsx/index.js';
import {
	Augment,
	Attribute,
	Component,
	StyleAttribute,
	bind,
	get,
	role,
} from '../component/index.js';
import { on, onAction, onLoad, trigger } from '../dom/index.js';
import { portal, slot, triggerEvent } from '../template/index.js';
import { css, padding, rgba } from '../css/index.js';
import { EMPTY, merge } from '../rx/index.js';
import { InversePrimary, ResetSurface } from './theme.js';
import { IconButton, Svg, aria, ripple } from './core.js';
import { Drawer } from './dialog.js';

/**
 * The top app bar provides content and actions related to the current screen.
 * It’s used for branding, screen titles, navigation, and actions.
 *
 * @demo
 * <cxl-appbar>
 *   <cxl-navbar></cxl-navbar>
 *   <cxl-appbar-title>Appbar Title</cxl-appbar-title>
 *   <cxl-icon-button><cxl-icon icon="search"></cxl-icon></cxl-icon-button>
 *   <cxl-icon-button><cxl-icon icon="ellipsis-v"></cxl-icon></cxl-icon-button>
 * </cxl-appbar>
 *
 * @demo <caption>Appbar with Tabs</caption>
 * <cxl-appbar>
 *   <cxl-navbar></cxl-navbar>
 *   <cxl-appbar-title>Appbar with Tabs</cxl-appbar-title>
 *   <cxl-tabs>
 *     <cxl-tab selected>Tab 1</cxl-tab>
 *     <cxl-tab>Tab 2</cxl-tab>
 *     <cxl-tab>Tab 3</cxl-tab>
 *   </cxl-tabs>
 * </cxl-appbar>
 *
 * @see AppbarTitle
 */
@Augment<Appbar>(
	'cxl-appbar',
	role('heading'),
	aria('level', '1'),
	css({
		$: {
			display: 'block',
			...InversePrimary,
			backgroundColor: 'surface',
			flexShrink: 0,
			color: 'onSurface',
			elevation: 2,
		},
		$transparent: {
			boxShadow: 'none',
			variables: {
				surface: rgba(0, 0, 0, 0),
			},
		},
		flex: {
			display: 'flex',
			alignItems: 'center',
			height: 56,
			...padding(4, 16, 4, 16),
			font: 'h6',
		},
		actions: { marginRight: -8 },
		flex$extended: {
			alignItems: 'start',
			paddingBottom: 8,
			height: 128,
		},
		$fixed: { position: 'fixed', top: 0, right: 0, left: 0 },
		'@xlarge': {
			flex$center: {
				width: 1200,
				marginLeft: 'auto',
				marginRight: 'auto',
				paddingRight: 0,
				paddingLeft: 0,
			},
			tabs$center: {
				width: 1200,
				marginLeft: 'auto',
				marginRight: 'auto',
			},
		},
	}),
	_ => (
		<>
			<div className="flex">
				<slot></slot>
				<div $={portal('cxl-appbar-actions')} />
			</div>
			<div className="tabs">
				<slot $={slot('cxl-tabs')} />
				<div $={portal('cxl-appbar-tabs')} />
			</div>
		</>
	)
)
export class Appbar extends Component {
	/**
	 * @demo
	 * <cxl-appbar extended>
	 *   <cxl-appbar-title>Appbar Title</cxl-appbar-title>
	 *   <cxl-icon-button><cxl-icon icon="ellipsis-v"></cxl-icon></cxl-icon-button>
	 * </cxl-appbar>
	 */
	@StyleAttribute()
	extended = false;

	@StyleAttribute()
	center = false;
}

/**
 * @see Appbar
 */
@Augment(
	'cxl-appbar-title',
	css({
		$: {
			flexGrow: 1,
			marginBottom: 12,
			lineHeight: 24,
			paddingLeft: 16,
			paddingRight: 16,
			textDecoration: 'none',
			alignSelf: 'flex-end',
		},
	}),
	() => <slot />
)
export class AppbarTitle extends Component {
	@StyleAttribute()
	extended = false;
}

/**
 * @example
<cxl-tabs>
	<cxl-tab selected>Tab 1</cxl-tab>
	<cxl-tab href="#cxl-tabs">Tab 2</cxl-tab>
	<cxl-tab>Tab 3</cxl-tab>
</cxl-tabs>
 * @see Tabs
 */
@Augment<Tab>(
	'cxl-tab',
	role('tab'),
	css({
		$: { flexShrink: 0, flexGrow: 1 },
		'@small': {
			$: { display: 'inline-block' },
		},
		link: {
			...padding(16),
			paddingBottom: 12,
			backgroundColor: 'surface',
			font: 'button',
			color: 'onSurface',
			lineHeight: 18,
			textDecoration: 'none',
			textAlign: 'center',
			display: 'block',
			outline: 0,
		},
		$focusWithin: { filter: 'invert(0.2) saturate(2) brightness(1.1)' },
		$hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
	}),
	host => (
		<a
			className="link"
			href={get(host, 'href').map(val => val || 'javascript:')}
		>
			<slot />
		</a>
	),
	bind(ripple),
	bind(host =>
		get(host, 'selected').tap(val => {
			if (val) trigger(host, 'cxl-tab.selected');
		})
	)
)
export class Tab extends Component {
	@Attribute()
	href?: string;

	@Attribute()
	selected = false;
}

/**
 * Tabs organize content across different screens, data sets, and other interactions.
 * @example
<cxl-tabs>
	<cxl-tab selected>Tab 1</cxl-tab>
	<cxl-tab href="#cxl-tabs">Tab 2</cxl-tab>
	<cxl-tab>Tab 3</cxl-tab>
</cxl-tabs>
 * @see Tab
 */
@Augment<Tabs>(
	'cxl-tabs',
	role('tablist'),
	css({
		$: {
			backgroundColor: 'surface',
			color: 'onSurface',
			display: 'block',
			flexShrink: 0,
			position: 'relative',
			cursor: 'pointer',
			overflowX: 'auto',
		},
		selected: {
			transformOrigin: 'left',
			backgroundColor: 'secondary',
			height: 2,
			width: 100,
			scaleX: 0,
			display: 'none',
		},
		content: { display: 'flex' },
		'@small': {
			content: { display: 'block' },
		},
	}),
	() => (
		<div className="content">
			<slot />
		</div>
	),
	bind(el => {
		return merge(
			on(el, 'cxl-tab.selected').tap(ev => {
				if (el.selected) el.selected.selected = false;
				if (ev.target instanceof Tab) el.selected = ev.target;
			})
		);
	}),
	host => (
		<div
			className="selected"
			$={el =>
				onLoad().switchMap(() =>
					merge(get(host, 'selected'), on(window, 'resize')).tap(
						() => {
							const sel = host.selected;
							if (!sel) return (el.style.transform = 'scaleX(0)');
							// Add delay so styles finish rendering...
							requestAnimationFrame(() => {
								const scaleX = sel.clientWidth / 100;
								el.style.transform = `translate(${sel.offsetLeft}px, 0) scaleX(${scaleX})`;
								el.style.display = 'block';
							});
						}
					)
				)
			}
		/>
	)
)
export class Tabs extends Component {
	@Attribute()
	selected?: Tab;
}

const MenuIcon = (
	<Svg
		viewBox="0 0 24 24"
		width={24}
	>{`<path style="fill:currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />`}</Svg>
);

/**
 * Navigation drawers provide access to destinations in your app.
 */
@Augment<Navbar>(
	'cxl-navbar',
	role('navigation'),
	css({
		$: {
			display: 'inline-block',
			overflowScrolling: 'touch',
		},
		toggler: {
			backgroundColor: 'surface',
			color: 'onSurface',
			cursor: 'pointer',
			marginLeft: -8,
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
				{MenuIcon}
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

@Augment<Item>(
	'cxl-item',
	bind(ripple),
	css({
		$: {
			display: 'block',
			position: 'relative',
			color: 'onSurface',
			font: 'default',
			lineHeight: 24,
			paddingRight: 16,
			paddingLeft: 16,
			paddingTop: 12,
			paddingBottom: 12,
			alignItems: 'center',
			backgroundColor: 'surface',
		},
		$selected: {
			backgroundColor: 'primaryLight',
			color: 'onPrimaryLight',
		},
	}),
	bind(host => onAction(host).pipe(triggerEvent(host, 'drawer.close'))),
	() => <slot />
)
export class Item extends Component {
	@StyleAttribute()
	selected = false;
}
