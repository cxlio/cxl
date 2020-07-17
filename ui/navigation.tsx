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
import {
	onAction,
	onLocation,
	portal,
	tpl,
	triggerEvent,
} from '../template/index.js';
import { Style, padding } from '../css/index.js';
import { EMPTY, merge } from '../rx/index.js';
import { Focusable, FocusHighlight, Svg, aria, ripple } from './core.js';
import { Drawer } from './dialog.js';

/**
 * The top app bar provides content and actions related to the current screen. It’s used for branding, screen titles, navigation, and actions.
 *
 * @demo
 * <cxl-appbar>
 *   <cxl-navbar></cxl-navbar>
 *   <cxl-appbar-title>Appbar Title</cxl-appbar-title>
 *   <cxl-button flat primary><cxl-icon icon="search"></cxl-icon></cxl-button>
 *   <cxl-button flat primary><cxl-icon icon="ellipsis-v"></cxl-icon></cxl-button>
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
					backgroundColor: 'primary',
					flexShrink: 0,
					font: 'title',
					color: 'onPrimary',
					elevation: 2,
				},
				flex: {
					display: 'flex',
					alignItems: 'center',
					height: 56,
					paddingLeft: 16,
					paddingRight: 16,
					paddingTop: 4,
					paddingBottom: 4,
					font: 'h6',
				},

				flex$extended: {
					alignItems: 'start',
					height: 128,
					paddingBottom: 16,
					font: 'h5',
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
	 * <cxl-appbar-title>Appbar Title</cxl-appbar-title>
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
					lineHeight: 28,
					color: 'onPrimary',
					textDecoration: 'none',
					alignSelf: 'flex-end',
				},
				// $extended: { font: 'h5', alignSelf: 'flex-end' },
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
				width: 16,
				paddingTop: 4,
				marginRight: 32,
				cursor: 'pointer',
			},
			toggler$permanent$large: { display: 'none' },
		}}
	</Style>,
	render(host => (
		<Host>
			<Drawer
				$={el => ((host.drawer = el), EMPTY)}
				permanent={get(host, 'permanent')}
			>
				<slot />
			</Drawer>
			<div
				$={el =>
					onAction(el).tap(() => {
						if (host.drawer)
							host.drawer.visible = !host.drawer.visible;
					})
				}
				className="toggler"
			>
				{MenuIcon}
			</div>
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
<cxl-menu>
	<cxl-item disabled>Option disabled</cxl-item>
	<cxl-item selected>Option Selected</cxl-item>
	<cxl-item>Option 2</cxl-item>
	<cxl-hr></cxl-hr>
	<cxl-item>Option 3</cxl-item>
</cxl-menu>
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
	bind(ripple),
	<Focusable />,
	<Style>
		{{
			$: {
				cursor: 'pointer',
				position: 'relative',
				display: 'block',
			},
			link: {
				color: 'onSurface',
				outline: 0,
				lineHeight: 24,
				paddingRight: 16,
				paddingLeft: 16,
				paddingTop: 12,
				font: 'default',
				paddingBottom: 12,
				alignItems: 'center',
				backgroundColor: 'surface',
				textDecoration: 'none',
				display: 'flex',
			},
			content: { flexGrow: 1 },
			icon: {
				marginRight: 16,
				width: 28,
				color: 'onSurface',
				opacity: 0.7,
			},
			icon$selected: { color: 'onPrimaryLight' },
			link$selected: {
				backgroundColor: 'primaryLight',
				color: 'onPrimaryLight',
			},
			...FocusHighlight,
		}}
	</Style>,
	tpl(() => {
		function init(el: any, host: Item) {
			return merge(
				get(host, 'href').tap(val => (el.href = val)),
				onAction(host)
					.tap(ev => {
						if (ev.target === host && host.href) el.click();
					})
					.pipe(triggerEvent(el, 'drawer.close')),
				onLocation().tap(location => {
					if (host.href)
						host.selected = location.href.indexOf(el.href) === 0;
				})
			);
		}

		return (
			<a $={init} className="link" tabIndex={-1}>
				<div className="content">
					<slot />
				</div>
			</a>
		);
	})
)
export class Item extends Component {
	static tagName = 'cxl-item';

	@Attribute()
	href = '';

	@StyleAttribute()
	selected = false;

	@StyleAttribute()
	disabled = false;

	@Attribute()
	touched = false;
}
