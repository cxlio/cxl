import { Style, border } from '../css/index.js';
import { onAction, triggerEvent } from '../template/index.js';
import {
	Component,
	Augment,
	Attribute,
	StyleAttribute,
	ComponentView,
	bind,
	get,
	render,
	role,
} from '../component/index.js';
import { dom, Host } from '../xdom/index.js';
import { tap, merge } from '../rx/index.js';
import { on } from '../dom/index.js';

import { Checkbox } from './form.js';
import { registable, ariaProp } from './core.js';

function onHeaderAction(el: Th) {
	return merge(
		onAction(el).pipe(
			tap(() => {
				const sort = el['sort-order'];
				el['sort-order'] =
					sort === 'asc' ? 'desc' : sort === 'desc' ? 'none' : 'asc';
			})
		)
	);
}

function onSort(el: HTMLElement, view: ComponentView<Th>) {
	let lastClass: string;
	return get(view.host, 'sort-order').pipe(
		tap(sortOrder => {
			if (lastClass) el.classList.remove(lastClass);
			lastClass = sortOrder;
			el.classList.add(sortOrder);
		}),
		triggerEvent(el, 'datatable.sort')
	);
}

@Augment(
	'cxl-th',
	<Host $={onHeaderAction}>
		<Style>
			{{
				$: {
					display: 'table-cell',
					flexGrow: 1,
					font: 'body',
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
			}}
		</Style>
		<slot />
		<div $={onSort} className="sortIcon">
			{'\u25BC'}
		</div>
	</Host>
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
	<Host>
		<Style>
			{{
				$: {
					display: 'block',
					width: '100%',
					overflowX: 'auto',
					...border(1, 1, 0, 1),
					borderStyle: 'solid',
					borderColor: 'divider',
					borderRadius: 4,
				},
				'@small': { $: { display: 'table' } },
			}}
		</Style>
		<slot />
	</Host>
)
export class Table extends Component {}

@Augment(
	role('table-cell'),
	<Style>
		{{
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
		}}
	</Style>
)
class Cell extends Component {}

@Augment('cxl-td', <slot />)
export class Td extends Cell {}

@Augment<CheckboxCell>(
	<Style>
		{{
			$: { width: 48 },
			checkbox: { paddingTop: 0, paddingBottom: 0 },
		}}
	</Style>,
	bind(host =>
		get(host, 'checked').pipe(
			ariaProp(host, 'checked'),
			triggerEvent(host, 'change'),
			triggerEvent(host, host.selectEvent)
		)
	),
	render(host => (
		<Checkbox
			$={el =>
				on(el, 'change').pipe(tap(() => (host.checked = el.checked)))
			}
			checked={get(host, 'checked')}
			className="checkbox"
		/>
	)),
	<slot />
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
		on(host, 'datatable.select').pipe(
			tap(ev => {
				if (ev.target) host.selected = ev.target;
			})
		)
	),
	<Host>
		<Style>
			{{
				$: { display: 'table-row' },
				$selected: { backgroundColor: 'primaryLight' },
			}}
		</Style>
		<slot />
	</Host>
)
export class Tr extends Component {
	@StyleAttribute()
	selected = false;
}

@Augment(
	'cxl-table-header',
	<Style>
		{{
			$: {
				font: 'h6',
				lineHeight: 36,
				paddingTop: 16,
				paddingBottom: 16,
				paddingLeft: 16,
				paddingRight: 16,
			},
		}}
	</Style>,
	<slot />
)
export class TableHeader extends Component {}

@Augment<TableSelectedCount>(
	<Host>
		<Style>
			{{
				$: {
					font: 'subtitle',
					lineHeight: 36,
					height: 68,
					backgroundColor: 'primaryLight',
					color: 'onPrimaryLight',
					display: 'flex',
				},
			}}
		</Style>
	</Host>,
	render(host => (
		<div>
			{get(host, 'selected').pipe(tap(selected => selected?.length || 0))}
		</div>
	))
)
export class TableSelectedCount extends Component {
	@Attribute()
	selected: any;
}
