import { Augment, Attribute, get } from '@cxl/component';
import { dom, expression } from '@cxl/tsx';
import { onAction } from '@cxl/dom';
import { css } from './theme.js';
import { merge } from '@cxl/rx';
import { Option, SelectMenu, SelectBase } from './select.js';
import { navigationList, selectableHostMultiple } from '@cxl/template';

/**
 * A form input component that allows the user to select multiple option from a dropdown list
 * @example
 * <cxl-field>
 *   <cxl-label>Multi Select Box with label</cxl-label>
 *   <cxl-multiselect placeholder="(Select an Option)">
 *     <cxl-option selected value="1">Option 1</cxl-option>
 *     <cxl-option selected value="2">Option 2</cxl-option>
 *     <cxl-option value="3">Option 3</cxl-option>
 *   </cxl-multiselect>
 * </cxl-field>
 */
@Augment<MultiSelect>(
	'cxl-multiselect',
	css({
		menu: { left: -12, right: -12, top: 26, height: 0 },
		menu$opened: { height: 'auto' },
	}),
	host => (
		<SelectMenu
			$={el => get(host, 'opened').raf(() => host.positionMenu(el))}
			className="menu"
			visible={get(host, 'opened')}
		>
			<slot />
		</SelectMenu>
	),
	host =>
		merge(
			onAction(host).tap(() => {
				if (host.focusedOption) host.setSelected(host.focusedOption);
				else host.open();
			}),
			selectableHostMultiple(host).tap(selected =>
				host.setSelected(selected as Option)
			),
			navigationList(
				host,
				'cxl-option:not([disabled])',
				'cxl-option[focused]'
			).tap(selected => host.setFocusedOption(selected as Option))
		),
	host => (
		<div className="placeholder">
			{expression(
				host,
				get(host, 'value')
					.raf()
					.map(
						() =>
							[...host.selected]
								.map(s => s.textContent)
								.join(', ') || host.placeholder
					)
			)}
		</div>
	)
)
export class MultiSelect extends SelectBase {
	/**
	 * Placeholder value if nothing is selected.
	 */
	@Attribute()
	placeholder = '';

	readonly selected: Set<Option> = new Set<Option>();
	value: any[] = [];

	protected focusedOption?: Option;

	protected positionMenu(menu: SelectMenu) {
		let height: number;
		const rect = this.getBoundingClientRect();
		height = menu.scrollHeight;
		const maxHeight = window.innerHeight - rect.bottom;

		if (height > maxHeight) height = maxHeight;
		const style = menu.style;
		style.height = height + 'px';
	}

	protected setSelected(option: Option) {
		option.selected = !this.selected.has(option);
		const method = option.selected ? 'add' : 'delete';
		this.selected[method](option);
		const selected = [...this.selected];
		this.value = selected.map(o => o.value);
		if (this.opened) this.setFocusedOption(option);
	}

	protected setFocusedOption(option: Option) {
		this.clearFocusedOption();
		this.focusedOption = option;
		option.focused = true;
	}

	protected clearFocusedOption() {
		this.options?.forEach(o => (o.focused = false));
		this.focusedOption = undefined;
	}

	open() {
		if (this.disabled || this.opened) return;
		this.opened = true;
	}

	close() {
		if (this.opened) {
			this.opened = false;
			this.clearFocusedOption();
		}
	}
}
