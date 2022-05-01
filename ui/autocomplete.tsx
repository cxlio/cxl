///<amd-module name="@cxl/ui/autocomplete.js"/>
import { Augment, StyleAttribute, Component } from '@cxl/component';
import { dom } from '@cxl/tsx';
import { on, onAction, onKeypress } from '@cxl/dom';
import { be, merge } from '@cxl/rx';
import { navigationListUpDown, getSearchRegex } from '@cxl/template';

import { fieldInput } from './field.js';
import { css } from './theme.js';
import { Option, SelectMenu } from './select.js';

@Augment<Autocomplete>(
	'cxl-autocomplete',
	css({
		menu: {
			left: -12,
			right: -12,
			top: 26,
		},
		menu$visible: {},
	}),
	host => {
		let selected: Option | undefined = undefined;
		let focused: Option | undefined = undefined;
		const searchTerm = be('');
		const menu = (
			<SelectMenu className="menu">
				<slot />
			</SelectMenu>
		) as SelectMenu;

		function close() {
			menu.visible = false;
			selected = undefined;
		}

		host.bind(
			fieldInput(host).switchMap(input =>
				merge(
					on(input, 'input').tap(() => {
						menu.visible = true;
						searchTerm.next(input.value);
					}),
					on(input, 'blur').tap(close),
					onAction(host).tap(() => {
						if (selected) input.value = selected.value;
						menu.visible = false;
					}),
					searchTerm.tap(val => {
						const regex = getSearchRegex(val);
						for (const child of host.children) {
							const childValue = (child as any).value;
							(child as any).style.display =
								childValue && childValue.match?.(regex)
									? ''
									: 'none';
						}
					}),
					onKeypress(input, 'escape').tap(close),
					onKeypress(input, 'enter').tap(() => {
						if (selected) selected.focused = false;
						if (focused) {
							selected = focused;
							focused.selected = true;
						}
						close();
					}),
					navigationListUpDown(
						host,
						'cxl-option:not([disabled])',
						'cxl-option:not([disabled])[focused]',
						input
					)
						.log()
						.tap(newSelected => {
							if (focused) focused.focused = false;
							if (newSelected) {
								focused = newSelected as Option;
								focused.focused = true;
							}
						})
				)
			)
		);

		return menu;
	}
)
export class Autocomplete extends Component {
	@StyleAttribute()
	visible = false;
}
