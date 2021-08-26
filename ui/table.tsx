import { border, css, padding, margin } from '@cxl/css';
import {
	aria,
	each,
	triggerEvent,
	registable,
	registableHost,
	role,
	selectable,
	stopChildrenEvents,
} from '@cxl/template';
import {
	Component,
	Augment,
	Attribute,
	Span,
	StyleAttribute,
	attributeChanged,
	get,
} from '@cxl/component';
import { dom } from '@cxl/tsx';
import { EMPTY, defer, from, merge, observable } from '@cxl/rx';
import { on, onAction, onChildrenMutation, trigger } from '@cxl/dom';
import type {} from '@cxl/ui/theme.js';
import { IconButton } from '@cxl/ui/icon.js';
import { Svg, Path, T, Toolbar } from '@cxl/ui/core.js';
import { Checkbox } from '@cxl/ui/checkbox.js';
import { Option, SelectBox } from '@cxl/ui/select.js';
import { Field } from '@cxl/ui/field.js';

type DatasetController = (action: DataAction) => void;
type DataEvent = 'filter' | 'sort' | 'slice' | 'update' | 'select' | 'render';

interface SortableElement extends Component {
	sortable: boolean | 'numeric';
	sort: 'asc' | 'desc' | 'none';
	field?: string;
}

interface DataAction<T extends Component = Component> {
	type: DataEvent;
	target: T;
	value: any;
	state: any;
}

export function datasetRegistable<T extends Component>(
	host: T,
	controller: DatasetController
) {
	return registable(host, 'dataset', controller);
}

type SortFunction = (a: any, b: any, dir: 1 | -1) => number;

function textSort(a: string, b: string, dir = 1) {
	return String(a).localeCompare(b) * dir;
}

function numericSort(a: number, b: number, dir = 1) {
	return a === b ? 0 : a > b ? dir : -dir;
}

function datasetSortable($: SortableElement) {
	return datasetRegistable($, (ev: DataAction) => {
		if (ev.type === 'update') {
			if (
				ev.value &&
				ev.value.detail === 'sortable' &&
				ev.value.target !== $ &&
				$.sort !== 'none'
			)
				$.sort = 'none';
			else if ($.sort !== 'none')
				ev.state.sort = { field: $.field, sort: $.sort };
		} else if (ev.type === 'sort' && $.sort !== 'none') {
			const field = $.field;
			const dir = $.sort === 'asc' ? 1 : -1;
			const algo = ($.sortable === 'numeric'
				? numericSort
				: textSort) as SortFunction;
			ev.value = (ev.value as any[]).sort(
				field
					? (a, b) => algo(a[field], b[field], dir)
					: (a, b) => algo(a, b, dir)
			);
		}
	});
}

function onHeaderAction(el: Th) {
	return get(el, 'sortable').switchMap(isSortable =>
		isSortable
			? merge(
					datasetSortable(el),
					onAction(el).tap(() => {
						const sort = el.sort;
						el.sort =
							sort === 'asc'
								? 'desc'
								: sort === 'desc'
								? 'none'
								: 'asc';
					})
			  )
			: EMPTY
	);
}

function onSort(el: HTMLElement, host: Th) {
	let lastClass: string;
	return get(host, 'sort').tap(sortOrder => {
		if (lastClass) el.classList.remove(lastClass);
		lastClass = sortOrder;
		el.classList.add(sortOrder);

		if (!host.field) return;

		trigger(
			host,
			'dataset.update',
			host.sort === 'none' ? 'sortable.reset' : 'sortable'
		);
	});
}

@Augment<SortIcon>()
export class SortIcon extends Component {}

@Augment<Th>(
	'cxl-th',
	role('columnheader'),
	onHeaderAction,
	css({
		$: {
			display: 'table-cell',
			font: 'subtitle2',
			color: 'headerText',
			...padding(16),
			...border(0, 0, 1, 0),
			lineHeight: 24,
			borderStyle: 'solid',
			borderColor: 'divider',
			whiteSpace: 'nowrap',
		},
		sortIcon: {
			display: 'none',
			marginLeft: 8,
			scaleY: 0,
			scaleX: 0,
			transformOrigin: 'center',
			verticalAlign: 'middle',
		},
		$sortable: { cursor: 'pointer' },
		$sortable$hover: { color: 'onSurface' },
		sortIcon$sortable: { display: 'inline-block' },
		none$sortable$hover: { scaleX: 1, scaleY: 1, opacity: 0.3 },
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
			<Span className="sortIcon" $={el => onSort(el, $)}>
				<Svg viewBox="0 0 24 24" width={24}>
					<Path d="M0 0h24v24H0V0z" fill="none" />
					<Path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />
				</Svg>
			</Span>
		</>
	)
)
export class Th extends Component {
	@Attribute()
	width?: number;

	@StyleAttribute()
	sortable: boolean | 'numeric' = false;

	@Attribute()
	sort: 'asc' | 'desc' | 'none' = 'none';

	@Attribute()
	field?: string;
}

/**
 * Tables display sets of data across rows and columns.
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
			font: 'body2',
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
	role('cell'),
	css({
		$: {
			display: 'table-cell',
			...padding(16),
			lineHeight: 20,
			flexGrow: 1,
			...border(0, 0, 1, 0),
			borderStyle: 'solid',
			borderColor: 'divider',
		},
		$right: { textAlign: 'right' },
		$primary: { backgroundColor: 'primary', color: 'onPrimary' },
		$secondary: { backgroundColor: 'secondary', color: 'onSecondary' },
	})
)
class Cell extends Component {
	@StyleAttribute()
	right = false;
}

@Augment('cxl-td', () => <slot />)
export class Td extends Cell {}

@Augment<TableSelectAll>(
	'cxl-table-select-all',
	aria('label', 'Select All'),
	$ =>
		datasetRegistable($, ev => {
			if (ev.type === 'select' && ev.value === 'select') {
				const dataset = ev.target as Dataset;
				let count = 0;
				dataset.selectable.forEach((r: any) => r.selected && count++);
				$.indeterminate =
					count > 0 && count !== dataset.selectable.size;
				if (!$.indeterminate) $.checked = count > 0;
			}
		}),
	$ =>
		on($, 'change').tap(() => {
			if ($.value !== undefined)
				trigger(
					$,
					'dataset.select',
					$.checked ? 'select.all' : 'select.none'
				);
		})
)
export class TableSelectAll extends Checkbox {}

@Augment<Tr>(
	'cxl-tr',
	role('row'),
	css({
		$: { display: 'table-row' },
	}),
	$ => attributeChanged($, 'value').pipe(triggerEvent($, 'change')),
	_ => <slot />
)
export class Tr extends Component {
	@Attribute()
	value?: any;
}

@Augment<TrSelectable>(
	'cxl-tr-selectable',
	role('row'),
	css({
		$: { display: 'table-row' },
		$selected: { backgroundColor: 'primaryLight' },
		$hover: { backgroundColor: 'onSurface8' },
		$selected$hover: { backgroundColor: 'primaryLight' },
		cell: { width: 48, lineHeight: 0, verticalAlign: 'bottom' },
	}),
	$ => selectable($),
	$ => attributeChanged($, 'value').pipe(triggerEvent($, 'change')),
	$ =>
		datasetRegistable($, ev => {
			if (ev.type === 'update')
				$.selected = (ev.target as Dataset).selected.has($.value);
			else if (ev.type === 'select') {
				if (ev.value === 'select.all') $.selected = true;
				else if (ev.value === 'select.none') $.selected = false;
			}
		}),
	$ => {
		if ($.selected) trigger($, 'dataset.select', 'select');
		return attributeChanged($, 'selected').tap(() =>
			trigger($, 'dataset.select', 'select')
		);
	},
	$ => (
		<>
			<Td
				$={el => on(el, 'click').tap(() => ($.selected = !$.selected))}
				className="cell"
			>
				<Checkbox
					$={el =>
						merge(
							on(el, 'change').tap(
								() => ($.selected = el.checked)
							),
							on(el, 'click').tap(ev => ev.stopPropagation())
						)
					}
					ariaLabel="Select Row"
					checked={get($, 'selected')}
				/>
			</Td>
			<slot />
		</>
	)
)
export class TrSelectable extends Component {
	@StyleAttribute()
	selected = false;

	@Attribute()
	value: any;
}

@Augment(
	'cxl-tbody',
	role('rowgroup'),
	css({
		$: { display: 'table-row-group' },
	}),
	() => <slot />
)
export class TableBody extends Component {}

@Augment(
	'cxl-table-toolbar',
	css({
		$: {
			...border(1, 1, 0, 1),
			...padding(6, 16, 6, 16),
			lineHeight: 44,
			borderStyle: 'solid',
			borderColor: 'divider',
		},
	}),
	_ => <slot />
)
export class TableToolbar extends Toolbar {}

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

export function getPageCount(total: number, rows: number) {
	if (total === 0 || rows === 0) return 0;
	return Math.floor(total / rows) + (total % rows === 0 ? -1 : 0);
}

@Augment<TablePagination>(
	'cxl-table-pagination',
	css({
		$: {
			display: 'block',
			font: 'body2',
			textAlign: 'center',
			...border(0, 1, 1, 1),
			...padding(6, 16, 6, 16),
			lineHeight: 44,
			borderStyle: 'solid',
			borderColor: 'divider',
		},
		rows: {
			display: 'inline-block',
			...margin(0, 24, 0, 16),
			width: 64,
			verticalAlign: 'middle',
		},
		'@small': {
			$: {
				textAlign: 'right',
			},
			nav: {
				display: 'inline-block',
				marginLeft: 32,
			},
		},
	}),
	$ =>
		datasetRegistable($, action => {
			if (action.type === 'update') {
				action.state.slice = { page: $.page, rows: $.rows };
			} else if (action.type === 'slice') {
				const data = action.value;
				const start = $.page * $.rows;
				($ as any).total = data.length;
				action.value = data.slice(start, start + $.rows);
			}
		}),
	$ =>
		get($, 'page').tap(val => {
			const max = getPageCount($.total, $.rows);
			if (val < 0) $.page = 0;
			else if (val > max) $.page = max;
		}),
	$ =>
		merge(get($, 'page'), get($, 'rows')).tap(() =>
			trigger($, 'dataset.update')
		),
	$ => (
		<$.Shadow>
			Rows per page:
			<Field className="rows" outline dense>
				<SelectBox
					$={el => on(el, 'change').tap(() => ($.rows = el.value))}
					ariaLabel="Rows per Page"
					value={get($, 'rows')}
				>
					{each(get($, 'options'), op => (
						<Option value={op}>{op.toString()}</Option>
					))}
				</SelectBox>
			</Field>
			{merge(get($, 'page'), get($, 'rows'), get($, 'total')).map(() => {
				const start = $.page * $.rows;
				const end = start + $.rows;
				return `${start + 1}-${end > $.total ? $.total : end} of ${
					$.total
				}`;
			})}
			<nav className="nav">
				<IconButton $={el => onAction(el).tap(() => $.goFirst())}>
					<Svg viewBox="0 0 24 24" width={20}>
						<Path d="M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z" />
						<Path d="M24 24H0V0h24v24z" fill="none" />
					</Svg>
				</IconButton>
				<IconButton $={el => onAction(el).tap(() => $.goPrevious())}>
					<Svg viewBox="0 0 24 24" width={20}>
						<Path d="M0 0h24v24H0z" fill="none" />
						<Path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
					</Svg>
				</IconButton>
				<IconButton $={el => onAction(el).tap(() => $.goNext())}>
					<Svg viewBox="0 0 24 24" width={20}>
						<Path d="M0 0h24v24H0z" fill="none" />
						<Path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
					</Svg>
				</IconButton>
				<IconButton $={el => onAction(el).tap(() => $.goLast())}>
					<Svg viewBox="0 0 24 24" width={20}>
						<Path d="M0 0h24v24H0V0z" fill="none" />
						<Path d="M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z" />
					</Svg>
				</IconButton>
			</nav>
		</$.Shadow>
	)
)
export class TablePagination extends Component {
	@Attribute()
	rows = 5;

	@Attribute()
	options = [5, 10, 25, 50];

	@Attribute()
	page = 0;

	@Attribute()
	readonly total = 0;

	goFirst() {
		this.page = 0;
	}
	goNext() {
		this.page += 1;
	}
	goPrevious() {
		this.page -= 1;
	}
	goLast() {
		this.page = getPageCount(this.total, this.rows);
	}
}

@Augment<Dataset>('cxl-dataset', $ => {
	const elements = new Set<DatasetController>();
	let state: any = {};

	function dispatch(action: DataAction<any>) {
		elements.forEach(e => e(action));
		return action.value;
	}

	function onAction(ev?: CustomEvent) {
		const value = ev;
		const newState = {};
		dispatch({ type: 'update', value, target: $, state: newState });
		state = newState;
	}

	function update() {
		if ($.update) return $.update(state);

		const value: any[] = $.source.slice(0);
		const action: DataAction<any> = {
			type: 'filter',
			target: $,
			value,
			state,
		};

		elements.forEach(e => e(action));
		action.type = 'sort';
		elements.forEach(e => e(action));
		action.type = 'slice';
		elements.forEach(e => e(action));
		action.type = 'render';
		elements.forEach(e => e(action));

		$.value = action.value;
	}

	return merge(
		stopChildrenEvents($, 'change'),
		merge(get($, 'source'), on($, 'dataset.update').tap(onAction)).raf(
			update
		),
		registableHost<any>($, 'selectable', $.selectable),
		registableHost<DatasetController>($, 'dataset', elements).raf(() =>
			onAction()
		),
		on($, 'dataset.select')
			.tap(ev => {
				const el = ev.target as any;
				$.selected[el.selected ? 'add' : 'delete'](el.value);
			})
			.raf(ev =>
				dispatch({ type: 'select', value: ev.detail, target: $, state })
			),
		attributeChanged($, 'value').pipe(triggerEvent($, 'change'))
	);
})
export class Dataset extends Component {
	@Attribute()
	source: any[] = [];

	@Attribute()
	value: any[] = [];

	readonly selectable = new Set<any>();

	readonly selected = new Set<any>();

	update?: (state: any) => any[];
}

@Augment<DataTable>('cxl-datatable', _ => (
	<>
		<slot name="header" />
		<Table>
			<slot />
		</Table>
		<slot name="footer" />
	</>
))
export class DataTable extends Dataset {}

@Augment<TableSource>(
	'cxl-table-source',
	role('rowgroup'),
	css({
		$: { display: 'table-row-group' },
	}),
	$ => {
		function createSlots(len: number) {
			const slots = $.shadowRoot!.querySelectorAll('slot');
			let slotCount = slots.length;
			if (slotCount > len)
				while (slotCount-- > len) slots[slotCount].remove();
			else if (slotCount < len)
				while (slotCount < len) {
					const el = <slot name={`row${slotCount++}`} />;
					$.shadowRoot?.appendChild(el);
				}
		}

		return merge(
			datasetRegistable($, action => {
				if (
					action.type === 'update' &&
					action.value?.detail === 'table-source.update'
				) {
					const source: any[] = [];
					for (const child of $.children as any)
						if (child.value !== undefined) source.push(child.value);

					(action.target as Dataset).source = source;
				} else if (action.type === 'render') {
					createSlots(action.value.length);

					for (const child of $.children) {
						const index = action.value.indexOf(
							(child as any).value
						);
						child.slot = index === -1 ? '' : `row${index}`;
					}
				}
			}),
			onChildrenMutation($).tap(() => {
				trigger($, 'dataset.update', 'table-source.update');
			}),
			observable(() =>
				trigger($, 'dataset.update', 'table-source.update')
			)
		);
	}
)
export class TableSource extends Component {}

@Augment<DatasetSource>('cxl-dataset-source', $ => {
	let data: any;
	return merge(
		datasetRegistable($, action => {
			if (
				action.type === 'update' &&
				action.value?.detail === 'dataset-source.update'
			) {
				(action.target as Dataset).source = data;
			}
		}),
		get($, 'src').switchMap(src =>
			defer(() =>
				src ? from(fetch(src).then(res => res.json())) : EMPTY
			).tap(newData => {
				data = newData;
				trigger($, 'dataset.update', 'dataset-source.update');
			})
		)
	);
})
export class DatasetSource extends Component {
	@Attribute()
	src?: string;
}
