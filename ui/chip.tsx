///<amd-module name="@cxl/ui/chip.js"/>
import {
	Attribute,
	Augment,
	Component,
	Span,
	StyleAttribute,
} from '@cxl/component';
import { baseColor, css } from '@cxl/css';
import { Focusable } from '@cxl/template';
import { dom } from '@cxl/tsx';
import { on, trigger } from '@cxl/dom';
import { CloseIcon } from './icon.js';
import {
	ColorAttribute,
	ColorValue,
	FocusHighlight,
	Size,
	SizeAttribute,
} from './core.js';

/**
 * Chips are compact elements that represent an input, attribute, or action.
 * @example
 * <cxl-chip>Single Chip</cxl-chip>
 * <cxl-chip secondary removable>Removable</cxl-chip>
 * <cxl-chip><cxl-avatar size="small"></cxl-avatar> Chip with Avatar</cxl-chip>
 */
@Augment<Chip>(
	'cxl-chip',
	Focusable,
	css({
		$: {
			variables: {
				surface: baseColor('onSurface12'),
			},
			font: 'subtitle2',
			backgroundColor: 'surface',
			display: 'inline-flex',
			color: 'onSurface',
			verticalAlign: 'middle',
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

	/** @deprecated */
	@StyleAttribute()
	primary = false;
	/** @deprecated */
	@StyleAttribute()
	secondary = false;

	@ColorAttribute()
	color?: ColorValue;

	@SizeAttribute(s => ({
		fontSize: 14 + s * 2,
		lineHeight: 20 + s * 4,
		height: 32 + s * 6,
		borderRadius: 16 + s * 2,
	}))
	size: Size = 0;

	remove() {
		super.remove();
		trigger(this, 'cxl-chip.remove');
	}
}
