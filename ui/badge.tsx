///<amd-module name="@cxl/ui/badge.js"/>
import { Augment, Component, StyleAttribute } from '@cxl/component';
import { css } from '@cxl/css';
import { dom } from '@cxl/tsx';
import { Size, SizeAttribute } from './core.js';

/**
 * Chips represent complex entities in small blocks. A chip can contain several
 * different elements such as avatars, text, and icons.
 *
 * @example
 * <cxl-avatar></cxl-avatar><cxl-badge top over>5</cxl-badge><br/>
 */
@Augment(
	'cxl-badge',
	css({
		$: {
			display: 'inline-block',
			position: 'relative',
			lineHeight: 20,
			font: 'caption',
			borderRadius: 11,
			color: 'onPrimary',
			backgroundColor: 'primary',
			textAlign: 'center',
			flexShrink: 0,
		},
		$secondary: {
			color: 'onSecondary',
			backgroundColor: 'secondary',
		},
		$error: { color: 'onError', backgroundColor: 'error' },
		$over: { marginLeft: -8 },
		$top: { verticalAlign: 'top' },
	}),
	() => <slot />
)
export class Badge extends Component {
	@SizeAttribute(s => ({
		width: 20 + s * 12,
		height: 20 + s * 12,
		marginRight: -10 + s * -6,
	}))
	size: Size = 0;

	@StyleAttribute()
	secondary = false;

	@StyleAttribute()
	error = false;

	@StyleAttribute()
	over = false;
}
