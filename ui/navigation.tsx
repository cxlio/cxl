///<amd-module name="@cxl/ui/navigation.js"/>
import { dom } from '@cxl/tsx';
import {
	Augment,
	Attribute,
	Component,
	StyleAttribute,
	get,
} from '@cxl/component';
import { on, onAction, onChildrenMutation, onLoad, trigger } from '@cxl/dom';
import {
	StateStyles,
	focusable,
	navigationList,
	aria,
	portal,
	role,
	triggerEvent,
} from '@cxl/template';
import { css, padding, rgba } from '@cxl/css';
import { EMPTY, merge } from '@cxl/rx';
import { InversePrimary, ResetSurface } from './theme.js';
import { Span, Toggle, ripple } from './core.js';
import { ArrowBackIcon, MenuIcon, IconButton } from './icon.js';
import { Drawer } from './dialog.js';

/**
 * The top app bar provides content and actions related to the current screen.
 * It’s used for branding, screen titles, navigation, and actions.
 *
 * @demo
 * <cxl-appbar>
 *   <cxl-navbar></cxl-navbar>
 *   <cxl-appbar-title>Appbar Title</cxl-appbar-title>
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
			textAlign: 'left',
			color: 'onSurface',
			elevation: 2,
		},
		$transparent: {
			boxShadow: 'none',
			variables: {
				surface: rgba(0, 0, 0, 0),
			},
		},
		grow: { flexGrow: 1 },
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
		'a, ::slotted(cxl-appbar-title)': {
			marginBottom: 12,
			alignSelf: 'flex-end',
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
		contextual: {
			display: 'none',
		},
		flex$contextual: {
			display: 'none',
		},
		contextual$contextual: {
			display: 'flex',
		},
		back: {
			marginLeft: -8,
		},
	}),
	portal('cxl-appbar'),
	$ =>
		merge(onChildrenMutation($), get($, 'contextual')).raf(() => {
			for (const el of $.children)
				if (el instanceof AppbarContextual)
					el.visible = el.name === $.contextual;
		}),
	host => (
		<>
			<div className="flex">
				<slot />
				<Span className="actions" $={portal('cxl-appbar-actions')} />
			</div>
			<div className="flex contextual">
				<IconButton
					className="back"
					$={el =>
						onAction(el).tap(() => (host.contextual = undefined))
					}
				>
					<ArrowBackIcon />
				</IconButton>
				<div className="grow">
					<host.Slot selector="cxl-appbar-contextual" />
				</div>
			</div>
			<div className="tabs">
				<host.Slot selector="cxl-tabs" />
			</div>
			<div className="fab">
				<host.Slot selector="cxl-fab" />
			</div>
		</>
	)
)
export class Appbar extends Component {
	/**
	 * Extends the appbar height.
	 * @demo
	 * <cxl-appbar extended>
	 *   <cxl-appbar-title>Appbar Title</cxl-appbar-title>
	 * </cxl-appbar>
	 */
	@StyleAttribute()
	extended = false;

	/**
	 * Centers Appbar in large screens
	 */
	@StyleAttribute()
	center = false;

	/**
	 * Sets or gets the active contextual menu.
	 * @see AppbarContextual
	 * @demo
	 * <cxl-appbar contextual="test">
	 * <cxl-appbar-title>Appbar Title</cxl-appbar-title>
	 * <cxl-appbar-contextual name="test">Contextual Appbar</cxl-appbar-contextual>
	 * </cxl-appbar>
	 */
	@StyleAttribute()
	contextual?: string;
}

/**
 * A top app bar can transform into a contextual action bar to provide contextual actions to selected items. Upon closing, the contextual action bar transforms back into a top app bar.
 * @see Appbar
 */
@Augment(
	'cxl-appbar-contextual',
	css({ $: { display: 'none' }, $visible: { display: 'block' } }),
	_ => <slot />
)
export class AppbarContextual extends Component {
	@Attribute()
	name?: string;

	@StyleAttribute()
	visible = false;
}

/**
 * @see Appbar
 */
@Augment(
	'cxl-appbar-title',
	css({
		$: {
			flexGrow: 1,
			lineHeight: 24,
			marginRight: 16,
			textDecoration: 'none',
		},
		$extended: {
			marginBottom: 12,
			alignSelf: 'flex-end',
		},
		parentslot: { display: 'none' },
		'@small': {
			parentslot: { display: 'contents' },
		},
	}),
	() => (
		<>
			<slot className="parentslot" name="parent"></slot>
			<slot />
		</>
	)
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
		$: {
			flexShrink: 0,
			flexGrow: 1,
			...padding(16, 16, 12, 16),
			backgroundColor: 'surface',
			font: 'button',
			color: 'onSurface',
			lineHeight: 18,
			textDecoration: 'none',
			textAlign: 'center',
			display: 'block',
			outline: 0,
			minWidth: 90,
		},
		'@small': {
			$: { display: 'inline-block' },
		},
		$focusWithin: { filter: 'invert(0.2) saturate(2) brightness(1.1)' },
		$hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
	}),
	ripple,
	_ => <slot />,
	host =>
		get(host, 'selected').tap(val => {
			if (val) trigger(host, 'cxl-tab.selected');
		})
)
export class Tab extends Component {
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
	el =>
		on(el, 'cxl-tab.selected').tap(ev => {
			if (el.selected) el.selected.selected = false;
			if (ev.target instanceof Tab) el.selected = ev.target;
			else if ((ev as any).detail instanceof Tab)
				el.selected = (ev as any).detail;
		}),
	host => (
		<Span
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
