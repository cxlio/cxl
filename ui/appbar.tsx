///<amd-module name="@cxl/ui/appbar.js"/>
import { dom } from '@cxl/tsx';
import {
	Augment,
	Attribute,
	Component,
	StyleAttribute,
	get,
} from '@cxl/component';
import { onAction, onChildrenMutation } from '@cxl/dom';
import { aria, portal, role } from '@cxl/template';
import { padding } from '@cxl/css';
import { merge } from '@cxl/rx';
import { ColorAttribute, ColorValue, Span } from './core.js';
import { ArrowBackIcon, IconButton } from './icon.js';
import { css } from './theme.js';

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
			backgroundColor: 'surface',
			flexShrink: 0,
			textAlign: 'left',
			color: 'onSurface',
			elevation: 2,
		},
		$sticky: {
			position: 'sticky',
			top: 0,
			zIndex: 5,
		},
		$flat: {
			boxShadow: 'none',
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
		$padded: {
			...padding(20, 8, 20, 8),
		},
		'@small': {
			$padded: { ...padding(20, 32, 20, 32) },
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

	/**
	 * Enables sticky mode.
	 */
	@StyleAttribute()
	sticky = false;

	/**
	 * Removes elevation
	 */
	@StyleAttribute()
	flat = false;

	/**
	 * Adds extra padding.
	 */
	@StyleAttribute()
	padded = false;

	@ColorAttribute('primary')
	color?: ColorValue;
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
	/**
	 * The name of the contextual menu. Used by the contextual property of the Appbar component.
	 */
	@Attribute()
	name?: string;

	/**
	 * Determines the visibility of the component when attached to an Appbar.
	 */
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
export class AppbarTitle extends Component {}
