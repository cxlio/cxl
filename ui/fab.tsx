import { Augment, Component, Slot, StyleAttribute } from '@cxl/component';
import { css } from '@cxl/ui/theme.js';
import { Focusable, FocusHighlight, ripple } from './core.js';

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
