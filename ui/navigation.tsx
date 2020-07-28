import { dom } from '../xdom/index.js';
import {
	Augment,
	Attribute,
	Component,
	Host,
	Slot,
	StyleAttribute,
	bind,
	get,
	render,
	role,
} from '../component/index.js';
import { on, trigger } from '../dom/index.js';
import { onAction, portal, triggerEvent } from '../template/index.js';
import { InversePrimary, ResetInverse, Style, padding } from '../css/index.js';
import { EMPTY, merge } from '../rx/index.js';
import {
	IconButton,
	Focusable,
	FocusHighlight,
	Svg,
	aria,
	ripple,
} from './core.js';
import { Drawer } from './dialog.js';

/**
 * The top app bar provides content and actions related to the current screen. It’s used for branding, screen titles, navigation, and actions.
 *
 * @demo
 * <cxl-appbar>
 *   <cxl-navbar></cxl-navbar>
 *   <cxl-appbar-title>Appbar Title</cxl-appbar-title>
 *   <cxl-icon-button><cxl-icon icon="search"></cxl-icon></cxl-icon-button>
 *   <cxl-icon-button><cxl-icon icon="ellipsis-v"></cxl-icon></cxl-icon-button>
 * </cxl-appbar>
 *
 * @see AppbarTitle
 */
@Augment<Appbar>(
	'cxl-appbar',
	role('heading'),
	aria('level', '1'),
	<Host>
		<Style>
			{{
				$: {
					display: 'block',
					...InversePrimary,
					backgroundColor: 'surface',
					flexShrink: 0,
					font: 'title',
					color: 'onSurface',
					elevation: 2,
				},
				flex: {
					display: 'flex',
					alignItems: 'center',
					height: 56,
					...padding(4, 8, 4, 8),
					font: 'h6',
				},
				actions: { marginRight: -8 },
				flex$extended: {
					alignItems: 'start',
					height: 128,
					paddingBottom: 16,
					// font: 'h5',
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
			}}
		</Style>
		<div className="flex">
			<slot></slot>
			<div $={portal('cxl-appbar-actions')} />
		</div>
		<div className="tabs">
			<Slot selector="cxl-tabs"></Slot>
			<div $={portal('cxl-appbar-tabs')} />
		</div>
	</Host>
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
	<Host>
		<Style>
			{{
				$: {
					flexGrow: 1,
					marginTop: 8,
					marginBottom: 8,
					paddingLeft: 16,
					paddingRight: 16,
					lineHeight: 28,
					textDecoration: 'none',
					alignSelf: 'flex-end',
				},
			}}
		</Style>
		<slot />
	</Host>
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
	role('tab'),
	<Focusable />,
	<Style>
		{{
			$: { flexShrink: 0 },
			'@small': {
				$: { display: 'inline-block' },
			},
			link: {
				...padding(16),
				paddingBottom: 12,
				backgroundColor: 'primary',
				font: 'button',
				color: 'onPrimary',
				lineHeight: 20,
				textDecoration: 'none',
				textAlign: 'center',
				display: 'block',
			},
			...FocusHighlight,
		}}
	</Style>,
	render(host => (
		<a
			className="link"
			href={get(host, 'href').map(val => val || 'javascript:')}
		>
			<slot />
		</a>
	)),
	bind(ripple),
	bind(host =>
		get(host, 'selected').tap(val => {
			if (val) trigger(host, 'cxl-tab.selected');
		})
	)
)
export class Tab extends Component {
	static tagName = 'cxl-tab';

	@Attribute()
	href?: string;

	@Attribute()
	selected = false;
}

/**
 * @example
<cxl-tabs>
	<cxl-tab selected>Tab 1</cxl-tab>
	<cxl-tab href="#cxl-tabs">Tab 2</cxl-tab>
	<cxl-tab>Tab 3</cxl-tab>
</cxl-tabs>
 * @see Tab
 */
@Augment<Tabs>(
	role('tablist'),
	<Host>
		<Style>
			{{
				$: {
					backgroundColor: 'primary',
					color: 'onPrimary',
					display: 'block',
					flexShrink: 0,
					position: 'relative',
					cursor: 'pointer',
					overflowX: 'auto',
				},
				selected: {
					transformOrigin: 'left',
					backgroundColor: 'secondary',
					height: 4,
					width: 100,
					scaleX: 0,
					display: 'none',
				},
				content: { display: 'flex' },
				content$small: { display: 'block' },
			}}
		</Style>
		<div className="content">
			<slot />
		</div>
	</Host>,
	bind(el => {
		return merge(
			on(el, 'cxl-tab.selected').tap(ev => {
				if (el.selected) el.selected.selected = false;
				if (ev.target instanceof Tab) el.selected = ev.target;
			})
		);
	}),
	render(host => (
		<div
			className="selected"
			$={el =>
				get(host, 'selected').tap(sel => {
					if (!sel) return (el.style.transform = 'scaleX(0)');

					// Add delay so styles finish rendering...
					requestAnimationFrame(() => {
						const scaleX = sel.clientWidth / 100;
						el.style.transform = `translate(${sel.offsetLeft}px, 0) scaleX(${scaleX})`;
						el.style.display = 'block';
					});
				})
			}
		/>
	))
)
export class Tabs extends Component {
	static tagName = 'cxl-tabs';

	@Attribute()
	selected?: Tab;
}

const MenuIcon = (
	<Svg
		viewBox="0 0 24 24"
		width={24}
	>{`<path style="fill:currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />`}</Svg>
);

@Augment<Navbar>(
	role('navigation'),
	<Style>
		{{
			$: {
				display: 'inline-block',
				marginTop: 8,
				marginBottom: 8,
				overflowScrolling: 'touch',
			},
			toggler: {
				backgroundColor: 'surface',
				color: 'onSurface',
				cursor: 'pointer',
				marginLeft: 4,
			},
			drawer: ResetInverse,
			'@large': {
				toggler$permanent: { display: 'none' },
			},
		}}
	</Style>,
	render(host => (
		<Host>
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
		</Host>
	))
)
export class Navbar extends Component {
	static tagName = 'cxl-navbar';

	@StyleAttribute()
	permanent = false;

	@Attribute()
	drawer?: Drawer;
}

/**
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
	<Host>
		<Style>
			{{
				$: {
					elevation: 1,
					display: 'inline-block',
					backgroundColor: 'surface',
					overflowY: 'auto',
					color: 'onSurface',
					paddingTop: 8,
					paddingBottom: 8,
				},
				$dense: { paddingTop: 0, paddingBottom: 0 },
				$closed: { scaleY: 0 },
			}}
		</Style>
		<slot />
	</Host>
)
export class Menu extends Component {
	static tagName = 'cxl-menu';

	@StyleAttribute()
	closed = false;

	@StyleAttribute()
	dense = false;
}

@Augment<Item>(
	'cxl-item',
	bind(ripple),
	<Style>
		{{
			$: {
				display: 'block',
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
		}}
	</Style>,
	bind(host => onAction(host).pipe(triggerEvent(host, 'drawer.close'))),
	<slot />
)
export class Item extends Component {
	@StyleAttribute()
	selected = false;
}
