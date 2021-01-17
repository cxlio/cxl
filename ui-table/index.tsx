import { border, css } from '@cxl/css';
import { ariaProp, triggerEvent } from '@cxl/template';
import {
	Component,
	Augment,
	Attribute,
	StyleAttribute,
	bind,
	get,
	role,
} from '@cxl/component';
import { dom } from '@cxl/tsx';
import { tap } from '@cxl/rx';
import { on, onAction } from '@cxl/dom';
import '@cxl/ui/theme.js';
import { T, Span, registable } from '@cxl/ui/core.js';
import { Checkbox } from '@cxl/ui/checkbox.js';

function onHeaderAction(el: Th) {
	return onAction(el).tap(() => {
		const sort = el['sort-order'];
		el['sort-order'] =
			sort === 'asc' ? 'desc' : sort === 'desc' ? 'none' : 'asc';
	});
}

function onSort(el: HTMLElement, host: Th) {
	let lastClass: string;
	return get(host, 'sort-order').pipe(
		tap(sortOrder => {
			if (lastClass) el.classList.remove(lastClass);
			lastClass = sortOrder;
			el.classList.add(sortOrder);
		}),
		triggerEvent(el, 'datatable.sort')
	);
}

@Augment<Th>(
	'cxl-th',
	bind(onHeaderAction),
	css({
		$: {
			display: 'table-cell',
			flexGrow: 1,
			color: 'headerText',
			paddingTop: 12,
			paddingBottom: 12,
			paddingLeft: 16,
			paddingRight: 16,
			...border(0, 0, 1, 0),
			borderStyle: 'solid',
			borderColor: 'divider',
			lineHeight: 24,
			whiteSpace: 'nowrap',
		},
		sortIcon: {
			display: 'none',
			marginLeft: -18,
			marginRight: 8,
			scaleY: 0,
			scaleX: 0,
		},
		$sortable: { cursor: 'pointer' },
		$sortable$hover: { color: 'onSurface' },
		sortIcon$sortable: { display: 'inline-block' },
		asc: { rotate: 0, scaleX: 1, scaleY: 1 },
		desc: {
			rotate: 180,
			scaleX: 1,
			scaleY: 1,
		},
	}),
	$ => (
		<>
			<slot />
			<Span $={el => onSort(el, $)} className="sortIcon">
				{'\u25BC'}
			</Span>
		</>
	)
)
export class Th extends Component {
	eventType?: 'datatable.sort';

	@Attribute()
	width?: number;

	@StyleAttribute()
	sortable = false;

	@Attribute()
	'sort-order': 'asc' | 'desc' | 'none' = 'none';
}

/**
 * Data tables display sets of data across rows and columns.
 * @example
<cxl-table>
	<cxl-tr>
		<cxl-th width="100px">Header 1</cxl-th>
		<cxl-th>Header 2</cxl-th>
		<cxl-th>Header 3</cxl-th>
		<cxl-th>Header 4</cxl-th>
	</cxl-tr>
	<cxl-tr>
		<cxl-td>Cell 1</cxl-td>
		<cxl-td>Cell 2</cxl-td>
		<cxl-td>Cell 3</cxl-td>
		<cxl-td>Cell 4</cxl-td>
	</cxl-tr>
</cxl-table>
 * @see Tr Td
 */
@Augment(
	'cxl-table',
	role('table'),
	css({
		$: {
			display: 'block',
			width: '100%',
			font: 'default',
			overflowX: 'auto',
			...border(1, 1, 0, 1),
			borderStyle: 'solid',
			borderColor: 'divider',
			borderRadius: 4,
		},
		'@small': { $: { display: 'table' } },
	}),
	_ => <slot />
)
export class Table extends Component {}

@Augment(
	role('table-cell'),
	css({
		$: {
			display: 'table-cell',
			paddingTop: 12,
			paddingBottom: 12,
			paddingLeft: 16,
			paddingRight: 16,
			flexGrow: 1,
			...border(0, 0, 1, 0),
			borderStyle: 'solid',
			borderColor: 'divider',
		},
		$primary: { backgroundColor: 'primary', color: 'onPrimary' },
		$secondary: { backgroundColor: 'secondary', color: 'onSecondary' },
	})
)
class Cell extends Component {}

@Augment('cxl-td', () => <slot />)
export class Td extends Cell {}

@Augment<CheckboxCell>(
	css({
		$: { width: 48 },
		checkbox: { paddingTop: 0, paddingBottom: 0 },
	}),
	bind(host =>
		get(host, 'checked').pipe(
			ariaProp(host, 'checked'),
			triggerEvent(host, 'change'),
			triggerEvent(host, host.selectEvent)
		)
	),
	host => (
		<>
			<Checkbox
				$={el =>
					on(el, 'change').tap(() => (host.checked = el.checked))
				}
				checked={get(host, 'checked')}
				className="checkbox"
			/>
			<slot />
		</>
	)
)
export class CheckboxCell extends Cell {
	readonly selectEvent: string = 'datatable.select';

	@Attribute()
	checked = false;
}

@Augment<CheckboxTd>(
	'cxl-td-checkbox',
	bind(host => registable(host, 'datatable.checkbox'))
)
export class CheckboxTd extends CheckboxCell {}

@Augment<CheckboxTh>(
	'cxl-th-checkbox',
	bind(host => registable(host, 'datatable.checkboxAll'))
)
export class CheckboxTh extends CheckboxCell {
	readonly selectEvent = 'datatable.selectAll';
}

@Augment<Tr>(
	'cxl-tr',
	role('row'),
	bind(host =>
		on(host, 'datatable.select').tap(
			ev => (host.selected = (ev.target as CheckboxCell)?.checked)
		)
	),
	css({
		$: { display: 'table-row' },
		$selected: { backgroundColor: 'primaryLight' },
	}),
	_ => <slot />
)
export class Tr extends Component {
	@StyleAttribute()
	selected = false;
}

@Augment(
	'cxl-table-header',
	css({
		$: {
			font: 'h6',
			lineHeight: 36,
			paddingTop: 16,
			paddingBottom: 16,
			paddingLeft: 16,
			paddingRight: 16,
		},
	}),
	_ => <slot />
)
export class TableHeader extends Component {}

@Augment<TableSelectedCount>(
	css({
		$: {
			font: 'subtitle',
			lineHeight: 36,
			height: 68,
			backgroundColor: 'primaryLight',
			color: 'onPrimaryLight',
			display: 'flex',
		},
	}),
	host => (
		<T>{get(host, 'selected').tap(selected => selected?.length || 0)}</T>
	)
)
export class TableSelectedCount extends Component {
	@Attribute()
	selected: any;
}
