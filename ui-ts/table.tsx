import { Style } from '../css/index.js';
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
	role
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
	<Host $={onHeaderAction}>
		<Style>
			{{
				$: {
					display: 'table-cell',
					flexGrow: 1,
					font: 'caption',
					color: 'headerText',
					paddingTop: 12,
					paddingBottom: 12,
					paddingLeft: 8,
					paddingRight: 8,
					// borderBottom: '1px solid',
					borderColor: 'divider',
					lineHeight: 24,
					whiteSpace: 'nowrap'
				},
				sortIcon: {
					display: 'none',
					marginLeft: -18,
					marginRight: 8,
					scaleY: 0,
					scaleX: 0
				},
				$sortable: { cursor: 'pointer' },
				$sortable$hover: { color: 'onSurface' },
				sortIcon$sortable: { display: 'inline-block' },
				asc: { rotate: 0, scaleX: 1, scaleY: 1 },
				desc: {
					rotate: 180,
					scaleX: 1,
					scaleY: 1
				}
			}}
		</Style>
		<slot />
		<div $={onSort} className="sortIcon">
			{'\u25BC'}
		</div>
	</Host>
)
export class Th extends Component {
	static tagName = 'cxl-th';

	eventType?: 'datatable.sort';

	@Attribute()
	width?: number;

	@StyleAttribute()
	sortable = false;

	@Attribute()
	'sort-order': 'asc' | 'desc' | 'none' = 'none';
}

@Augment(
	role('table'),
	<Host>
		<Style>
			{{
				$: { display: 'block', width: '100%', overflowX: 'auto' },
				'@small': { $: { display: 'table' } }
			}}
		</Style>
		<slot />
	</Host>
)
export class Table extends Component {
	static tagName = 'cxl-table';
}

@Augment(
	role('table-cell'),
	<Style>
		{{
			$: {
				display: 'table-cell',
				paddingTop: 12,
				paddingBottom: 12,
				paddingLeft: 8,
				paddingRight: 8,
				flexGrow: 1,
				borderTop: 0,
				borderLeft: 0,
				borderRight: 0,
				borderBottom: 1,
				borderStyle: 'solid',
				borderColor: 'divider'
			},
			$firstChild: { paddingLeft: 16 },
			$lastChild: { paddingRight: 16 },
			$primary: { backgroundColor: 'primary', color: 'onPrimary' },
			$secondary: { backgroundColor: 'secondary', color: 'onSecondary' }
		}}
	</Style>
)
class Cell extends Component {}

@Augment(<slot />)
export class Td extends Cell {
	static tagName = 'cxl-td';
}

@Augment<CheckboxCell>(
	<Style>
		{{
			$: { width: 48 },
			checkbox: { paddingTop: 0, paddingBottom: 0 }
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

@Augment<CheckboxTd>(bind(host => registable(host, 'datatable.checkbox')))
export class CheckboxTd extends CheckboxCell {
	static tagName = 'cxl-td-checkbox';
}

@Augment<CheckboxTh>(bind(host => registable(host, 'datatable.checkboxAll')))
export class CheckboxTh extends CheckboxCell {
	readonly selectEvent = 'datatable.selectAll';
	static tagName = 'cxl-th-checkbox';
}

@Augment<Tr>(
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
				$selected: { backgroundColor: 'primaryLight' }
			}}
		</Style>
		<slot />
	</Host>
)
export class Tr extends Component {
	static tagName = 'cxl-tr';

	@StyleAttribute()
	selected = false;
}

@Augment(
	<Style>
		{{
			$: {
				font: 'h6',
				lineHeight: 36,
				paddingTop: 16,
				paddingBottom: 16,
				paddingLeft: 16,
				paddingRight: 16
			}
		}}
	</Style>,
	<slot />
)
export class TableHeader extends Component {
	static tagName = 'cxl-table-header';
}

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
					display: 'flex'
				}
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
