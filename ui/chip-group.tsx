///<amd-module name="@cxl/ui/chip-group.js"/>
import { Augment, Component } from '@cxl/component';
import dom from '@cxl/tsx';

import { css } from './theme.js';

@Augment<ChipGroup>(
	'cxl-chip-group',
	css({
		$: { columnGap: 8, rowGap: 8 },
	}),
	() => <slot />
)
export class ChipGroup extends Component {}
