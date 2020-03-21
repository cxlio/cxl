import { Style } from '../css/index.js';
import { onAction, triggerEvent } from '../template/index.js';
import {
	Component,
	Augment,
	Attribute,
	StyleAttribute,
	ComponentView,
	get,
	role
} from '../component/index.js';
import { dom, Host } from '../xdom/index.js';
import { tap, merge } from '../rx/index.js';

function onHeaderAction(el: TableHeader) {
	return merge(
		onAction(el).pipe(
			tap(() => {
				const sort = el.sortOrder;
				el.sortOrder =
					sort === 'asc' ? 'desc' : sort === 'desc' ? 'none' : 'asc';
			})
		)
	);
}

function onSort(el: HTMLElement, view: ComponentView<TableHeader>) {
	let lastClass: string;
	return get(view.host, 'sortOrder').pipe(
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
					lineHeight: 24
					// whiteSpace: 'nowrap'
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
export class TableHeader extends Component {
	static tagName = 'cxl-th';

	eventType?: 'datatable.sort';

	@Attribute()
	width?: number;

	@StyleAttribute()
	sortable = false;

	@Attribute()
	sortOrder: 'asc' | 'desc' | 'none' = 'none';
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
