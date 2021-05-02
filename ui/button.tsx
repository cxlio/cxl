///<amd-module name="@cxl/ui/button.js"/>
import {
	Attribute,
	Augment,
	Component,
	Slot,
	Span,
	StyleAttribute,
} from '@cxl/component';
import { dom } from '@cxl/tsx';
import { css } from '@cxl/css';
import { Focusable } from '@cxl/template';
import { on, trigger } from '@cxl/dom';
import { ButtonBase, FocusHighlight, ripple } from './core.js';
import { CloseIcon } from './icon.js';

/**
 * Buttons allow users to take actions, and make choices, with a single tap.
 * @example
 * <cxl-button primary>Primary</cxl-button>
 * <cxl-button flat>Flat</cxl-button>
 * <cxl-button outline>Outlined</cxl-button>
 */
@Augment('cxl-button', Slot)
export class Button extends ButtonBase {}

/**
 * Chips are compact elements that represent an input, attribute, or action.
 * @example
 * <cxl-chip>Single Chip</cxl-chip>
 * <cxl-chip secondary removable>Removable Chip</cxl-chip>
 * @example
 * <cxl-chip><cxl-avatar small></cxl-avatar> Chip with Avatar</cxl-chip>
 */
@Augment<Chip>(
	'cxl-chip',
	Focusable,
	css({
		$: {
			borderRadius: 16,
			font: 'subtitle2',
			backgroundColor: 'onSurface12',
			display: 'inline-flex',
			color: 'onSurface',
			height: 32,
			verticalAlign: 'top',
			alignItems: 'center',
		},
		$primary: {
			color: 'onPrimary',
			backgroundColor: 'primary',
		},
		$secondary: {
			color: 'onSecondary',
			backgroundColor: 'secondary',
		},
		$small: { font: 'caption', lineHeight: 20, height: 20 },
		content: {
			display: 'inline-block',
			marginLeft: 12,
			paddingRight: 12,
		},
		avatar: { display: 'inline-block' },
		remove: {
			display: 'none',
			marginRight: 8,
			cursor: 'pointer',
		},
		remove$removable: {
			display: 'inline-block',
		},
		...FocusHighlight,
	}),
	$ => (
		<>
			<span className="avatar">
				<$.Slot selector="cxl-avatar" />
			</span>
			<span className="content">
				<slot />
			</span>
		</>
	),
	host => (
		<Span
			$={el => on(el, 'click').tap(() => host.remove())}
			className="remove"
		>
			<CloseIcon width={16} />
		</Span>
	),
	host =>
		on(host, 'keydown').tap(ev => {
			if (
				host.removable &&
				(ev.key === 'Delete' || ev.key === 'Backspace')
			)
				host.remove();
		})
)
export class Chip extends Component {
	@StyleAttribute()
	removable = false;
	@StyleAttribute()
	disabled = false;
	@Attribute()
	touched = false;
	@StyleAttribute()
	primary = false;
	@StyleAttribute()
	secondary = false;
	@StyleAttribute()
	small = false;

	remove() {
		super.remove();
		trigger(this, 'cxl-chip.remove');
	}
}

/**
 * A floating action button (FAB) represents the primary action of a screen.
 * @demo
 * <cxl-fab title="Floating Action Button">&plus;</cxl-fab>
 */
@Augment(
	'cxl-fab',
	Focusable,
	css({
		$: {
			display: 'inline-block',
			elevation: 2,
			backgroundColor: 'secondary',
			color: 'onSecondary',
			borderRadius: 56,
			textAlign: 'center',
			paddingTop: 20,
			cursor: 'pointer',
			font: 'h6',
			paddingBottom: 20,
			lineHeight: 16,
			width: 56,
			overflowY: 'hidden',
		},
		$fixed: {
			position: 'fixed',
			height: 56,
			bottom: 16,
			right: 24,
		},
		'@small': {
			$fixed: { position: 'absolute', bottom: 'auto', marginTop: -28 },
		},
		$focus: { elevation: 4 },
	}),
	css(FocusHighlight),
	ripple,
	Slot
)
export class Fab extends Component {
	@StyleAttribute()
	disabled = false;
	@StyleAttribute()
	fixed = false;

	touched = false;
}
