///<amd-module name="@cxl/ui/button.js"/>
import { Augment, Slot } from '@cxl/component';
import { ButtonBase } from './core.js';

/**
 * Buttons allow users to take actions, and make choices, with a single tap.
 * @example
 * <cxl-button primary>Primary</cxl-button>
 * <cxl-button flat>Flat</cxl-button>
 * <cxl-button outline>Outlined</cxl-button>
 */
@Augment('cxl-button', Slot)
export class Button extends ButtonBase {}
