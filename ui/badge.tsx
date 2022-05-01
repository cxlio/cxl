///<amd-module name="@cxl/ui/badge.js"/>
import { Augment, Component, StyleAttribute } from '@cxl/component';
import { css } from './theme.js';
import { dom } from '@cxl/tsx';
import { ColorAttribute, ColorValue, Size, SizeAttribute } from './core.js';

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
			font: 'caption',
			textAlign: 'center',
			flexShrink: 0,
			paddingLeft: 2,
			paddingRight: 2,
		},
		$secondary: {
			color: 'onSecondary',
			backgroundColor: 'secondary',
		},
		$error: { color: 'onError', backgroundColor: 'error' },
		$over: { marginLeft: -8 },
		$top: { verticalAlign: 'top', alignSelf: 'start' },
	}),
	() => <slot />
)
export class Badge extends Component {
	@SizeAttribute(s => ({
		minWidth: 20 + s * 12,
		height: 20 + s * 12,
		marginRight: -10 + s * -6,
		borderRadius: 11 + s * 6,
		lineHeight: 20 + s * 12,
	}))
	size: Size = 0;

	@ColorAttribute('primary')
	color?: ColorValue;

	/** @deprecated */
	@StyleAttribute()
	secondary = false;

	/** @deprecated */
	@StyleAttribute()
	error = false;

	@StyleAttribute()
	over = false;

	@StyleAttribute()
	top = false;
}
