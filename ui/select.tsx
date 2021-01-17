import { dom, expression } from '@cxl/tsx';
import {
	Augment,
	Attribute,
	Component,
	Slot,
	StyleAttribute,
	bind,
	get,
	role,
} from '@cxl/component';
import { css } from '@cxl/css';
import { be, merge } from '@cxl/rx';
import { on, onAction, onKeypress } from '@cxl/dom';
import { triggerEvent } from '@cxl/template';
import { InputBase } from './input-base.js';
import {
	Svg,
	focusable,
	registableHost,
	navigationList,
	selectable,
	selectableHost,
} from './core.js';

@Augment<Option>(
	'cxl-option',
	role('option'),
	bind(selectable),
	bind(host => get(host, 'value').pipe(triggerEvent(host, 'change'))),
	css({
		$: {
			cursor: 'pointer',
			color: 'onSurface',
			lineHeight: 20,
			paddingRight: 16,
			display: 'flex',
			backgroundColor: 'surface',
			paddingLeft: 16,
			font: 'default',
			paddingTop: 14,
			paddingBottom: 14,
		},
		box: {
			display: 'none',
			width: 20,
			height: 20,
			borderWidth: 2,
			borderColor: 'onSurface',
			marginRight: 12,
			lineHeight: 16,
			borderStyle: 'solid',
			color: 'transparent',
		},
		box$multiple: { display: 'inline-block' },
		box$selected: {
			borderColor: 'primary',
			backgroundColor: 'primary',
			color: 'onPrimary',
		},
		content: { flexGrow: 1 },
		$focused: {
			backgroundColor: 'primaryLight',
			color: 'onPrimaryLight',
		},
		$inactive: {
			backgroundColor: 'transparent',
			color: 'onSurface',
		},
	}),
	_ => (
		<>
			<div className="box">
				<span className="focusCircle focusCirclePrimary" />
				<Svg
					className="check"
					viewBox="0 0 24 24"
				>{`<path stroke-width="4" style="fill:currentColor;stroke:currentColor" d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>`}</Svg>
			</div>
			<div className="content">
				<slot />
			</div>
		</>
	)
)
export class Option extends Component {
	private $value?: string;

	@Attribute()
	get value(): string {
		return this.$value === undefined ? this.textContent || '' : this.$value;
	}

	set value(val: string) {
		this.$value = val;
	}

	@StyleAttribute()
	selected = false;

	@StyleAttribute()
	focused = false;

	@StyleAttribute()
	inactive = false;

	@StyleAttribute()
	multiple = false;
}

@Augment<SelectMenu>(
	'cxl-select-menu',
	css({
		$: {
			position: 'absolute',
			opacity: 0,
			elevation: 0,
			right: -16,
			left: -16,
			overflowY: 'hidden',
			transformOrigin: 'top',
			pointerEvents: 'none',
		},
		$visible: {
			elevation: 3,
			opacity: 1,
			overflowY: 'auto',
			backgroundColor: 'surface',
			pointerEvents: 'auto',
		},
	}),
	Slot
)
export class SelectMenu extends Component {
	@StyleAttribute()
	visible = false;
}

@Augment<SelectBase>(
	role('listbox'),
	css({
		$: {
			display: 'inline-block',
			cursor: 'pointer',
			overflowY: 'hidden',
			overflowX: 'hidden',
			height: 20,
			position: 'relative',
			paddingRight: 16,
			flexGrow: 1,
		},
		$focus: { outline: 0 },
		caret: {
			position: 'absolute',
			right: 0,
			top: 0,
			lineHeight: 20,
			width: 20,
			height: 20,
		},
		$opened: { overflowY: 'visible', overflowX: 'visible' },
		$disabled: { pointerEvents: 'none' },
		placeholder: {
			color: 'onSurface',
			font: 'default',
			marginRight: 12,
		},
	}),

	el => {
		el.bind(
			merge(
				focusable(el),
				registableHost<Option>(el, 'selectable').tap(options =>
					el.setOptions(((el as any).options = options))
				),
				on(el, 'blur').tap(() => el.close()),
				onKeypress(el, 'escape').tap(() => el.close())
			)
		);
		return (
			<Svg className="caret" viewBox="0 0 24 24">
				{'<path d="M7 10l5 5 5-5z"></path>'}
			</Svg>
		);
	}
)
export abstract class SelectBase extends InputBase {
	@StyleAttribute()
	opened = false;

	readonly options?: Set<Option>;

	protected abstract setOptions(options: Set<Option>): void;
	protected abstract setSelected(option: Option): void;
	abstract open(): void;
	abstract close(): void;
}

/**
 * A form input component that allows the user to select a single option from a list
 *
 * @example
 * <cxl-field>
 *   <cxl-label>Select Box</cxl-label>
 *   <cxl-select>
 *     <cxl-option>Option 1</cxl-option>
 *     <cxl-option selected>Option 2</cxl-option>
 *     <cxl-option>Option 3</cxl-option>
 *   </cxl-select>
 * </cxl-field>
 *
 * @see MultiSelect
 */
@Augment<SelectBox>(
	'cxl-select',
	host =>
		merge(
			navigationList(
				host,
				'cxl-option:not([disabled])',
				'cxl-option:not([disabled])[selected]'
			).tap(selected => host.setSelected(selected as Option)),
			selectableHost(host).tap(selected =>
				host.setSelected(selected as Option)
			),
			onAction(host).tap(() => !host.opened && host.open())
		),
	host => (
		<SelectMenu
			$={el =>
				merge(
					on(el, 'change').tap(ev => ev.stopPropagation()),
					get(host, 'opened'),
					get(host, 'selected')
				).raf(() => host.positionMenu(el))
			}
			visible={get(host, 'opened')}
		>
			<slot />
		</SelectMenu>
	),
	host => (
		<div className="placeholder">
			{expression(host, host.selectedText$)}
		</div>
	)
)
export class SelectBox extends SelectBase {
	@Attribute()
	selected?: Option;

	protected selectedText$ = be('');

	protected positionMenu(menu: SelectMenu) {
		const option = this.selected;
		const rect = this.getBoundingClientRect();
		const menuTopPadding = 13;
		const maxTranslateY = rect.top;

		let height: number;
		let scrollTop = 0;
		let translateY = option ? option.offsetTop : 0;

		if (translateY > maxTranslateY) {
			scrollTop = translateY - menuTopPadding;
			translateY = maxTranslateY;
		}

		height = menu.scrollHeight - scrollTop;
		const maxHeight = window.innerHeight - rect.bottom + translateY;

		if (height > maxHeight) height = maxHeight;
		else if (height < rect.height) height = rect.height;

		const style = menu.style;
		style.transform =
			'translateY(' + (-translateY - menuTopPadding) + 'px)';
		style.height = height + 'px';
		menu.scrollTop = scrollTop;
	}

	protected setOptions(options: Set<Option>) {
		const { value, selected } = this;

		if (selected && options.has(selected)) return;

		let first: Option | null = null;
		for (const o of options) {
			first = first || o;

			if (value === o.value) return this.setSelected(o);
		}

		if (value === undefined && !this.selected && first)
			this.setSelected(first);
		else if (selected && !selected.parentNode) this.setSelected(undefined);
	}

	protected setSelected(option?: Option) {
		if (option !== this.selected) {
			if (this.selected)
				this.selected.selected = this.selected.focused = false;
			this.selected = option;
		}

		if (option) {
			option.selected = option.focused = true;
			this.selectedText$.next(option.textContent || '');
			this.value = option.value;
		} else if (option === undefined)
			this.selectedText$.next((this.value = ''));

		this.close();
	}

	open() {
		if (this.disabled || this.opened) return;
		if (this.selected) this.selected.inactive = false;
		this.opened = true;
	}

	close() {
		if (this.opened) this.opened = false;
		if (this.selected) this.selected.inactive = true;
	}
}
