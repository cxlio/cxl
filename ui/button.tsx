///<amd-module name="@cxl/ui/button.js"/>
import { Augment, Slot } from '@cxl/component';
import { ButtonBase, SizeAttribute, Size } from './core.js';

/**
 * Buttons allow users to take actions, and make choices, with a single tap.
 * @example
 * <cxl-button primary>Primary</cxl-button>
 * <cxl-button flat>Flat</cxl-button>
 * <cxl-button outline>Outlined</cxl-button>
 */
@Augment('cxl-button', Slot)
export class Button extends ButtonBase {
	@SizeAttribute(s => ({
		borderRadius: 2 + s * 2,
		fontSize: 14 + s * 4,
		lineHeight: 20 + s * 8,
		paddingRight: 16 + s * 4,
		paddingLeft: 16 + s * 4,
	}))
	size: Size = 0;
}
