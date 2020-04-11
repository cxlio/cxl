(cxl => {
	'use strict';
	const component = cxl.component;

	/*component({
		name: 'cxl-table',
		bindings: 'role(table)',
		styles: {
			$: { display: 'block', width: '100%', overflowX: 'auto' },
			$small: { display: 'table' }
		}
	});*/

	/*component(
		{
			name: 'cxl-th',
			events: ['datatable.sort'],
			attributes: ['width', 'sortable', 'sortOrder'],
			bindings:
				'role(columnheader) =width:style.inline(width) action:#onAction =sortable:bool:attribute(sort)',
			template: `
	<cxl-icon &="=sortable:.sortable .sortIcon =sortOrder:style:host.trigger(datatable.sort)" icon="arrow-up"></cxl-icon><span &="content"></span>
			`,
			styles: {
				$: {
					display: 'table-cell',
					flexGrow: 1,
					font: 'caption',
					color: 'headerText',
					paddingTop: 12,
					paddingBottom: 12,
					paddingLeft: 8,
					paddingRight: 8,
					borderBottom: '1px solid',
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
				$sort: { cursor: 'pointer' },
				$sort$hover: { color: 'onSurface' },
				sortIcon$sort: { display: 'inline-block' },
				asc: { rotate: 0, scaleX: 1, scaleY: 1 },
				desc: {
					rotate: '180deg',
					scaleX: 1,
					scaleY: 1
				}
			}
		},
		{
			sortOrder: 'none',

			toggleSort() {
				const sort = this.sortOrder;
				this.sortOrder =
					sort === 'asc' ? 'desc' : sort === 'desc' ? 'none' : 'asc';
			},
			onAction() {
				if (this.sortable) this.toggleSort();
			}
		}
	);
	*/

	/*component({
		name: 'cxl-td-checkbox',
		extend: 'cxl-td',
		attributes: ['data', 'checked'],
		bindings:
			'=checked:host.trigger(datatable.select) registable(datatable.checkbox)',
		styles: {
			$: { width: 48 },
			checkbox: { paddingTop: 0, paddingBottom: 0 }
		},
		template: `<cxl-checkbox &=".checkbox =checked::@checked"></cxl-checkbox>`
	});*/

	/*component(
		{
			name: 'cxl-th-checkbox',
			extend: 'cxl-td',
			attributes: ['checked'],
			bindings: 'registable(datatable.checkboxAll)',
			styles: {
				$: { width: 48 },
				checkbox: { paddingTop: 0, paddingBottom: 0 }
			},
			template: `<cxl-checkbox &=".checkbox =checked:#onChecked action:delay:#onAction:host.trigger(datatable.selectAll)"></cxl-checkbox>`
		},
		{
			onAction(ev, el) {
				if (this.checked === null && el.checked === false)
					this.checked = false;
				else this.checked = el.checked;
			},
			onChecked(val, el) {
				el.indeterminate = val === null;

				if (val !== null) el.checked = val;
			}
		}
	);*/

	/*component(
		{
			name: 'cxl-tr',
			attributes: ['selected'],
			bindings: 'role(row) on(datatable.select):#onSelect',
			styles: {
				$: { display: 'table-row' },
				$selected: { backgroundColor: 'primaryLight' }
			}
		},
		{
			onSelect(ev) {
				this.selected = ev.target.checked;
			}
		}
	);*/

	/*component({
		name: 'cxl-table-selected',
		extend: 'cxl-table-header',
		attributes: ['selected'],
		template: `
		<cxl-c grow><x &="=selected:len:text"></x> selected</cxl-c><div &="content"></div>
		`,
		styles: {

		}
	});*/

	component(
		{
			name: 'cxl-datatable',
			events: ['change'],
			bindings: `
				registable.host(datatable.checkbox):=selectable:#resetSelect
				registable.host(datatable.checkboxAll):=selectAll
				on(datatable.select):#onSelect
				on(datatable.selectAll):#onSelectAll
				=selected:#updateSelected
				=data:#update on(datatable.sort):#onSort:#update
				=value:host.trigger(change)
			`,
			attributes: ['data', 'rows', 'page', 'value', 'selected'],
			template: `
<div &="=selected:len:hide content(cxl-table-header)"></div>
<div &="=selected:len:show content(cxl-table-selected)"></div>
<cxl-table &="content"></cxl-table>
<cxl-pagination &="=rows:@rows =sortedData:@data @paginatedData:=value"></cxl-pagination>
			`
		},
		{
			selectAll: null,
			value: cxl.Undefined,
			rows: 5,
			page: 0,
			sortedByHeader: null,

			updateSelectAll(selected, selectAll) {
				if (!this.selectable || !selected || selected.size === 0)
					return selectAll.forEach(s => (s.checked = false));

				for (let el of this.selectable)
					if (!el.checked) {
						return selectAll.forEach(s => (s.checked = null));
					}

				selectAll.forEach(s => (s.checked = true));
			},

			updateSelected(selected) {
				if (this.selectable)
					this.selectable.forEach(
						el => (el.checked = selected && selected.has(el.data))
					);

				if (this.selectAll)
					this.updateSelectAll(selected, this.selectAll);
			},

			resetSelect() {
				this.selected = null;
			},

			onSelect(ev) {
				const el = ev.target,
					data = ev.target.data;

				this.selected = new Set(this.selected);
				this.selected[el.checked ? 'add' : 'delete'](data);
			},

			onSelectAll(ev) {
				if (this.selectable) {
					const checked = ev.target.checked;
					this.selectable.forEach(el => (el.checked = checked));
				}
			},

			onSort(ev) {
				const order = ev.detail,
					th = ev.target,
					sortedEl = this.sortedByHeader;
				if (order === 'none') {
					if (sortedEl === th)
						this.sortedByHeader = this.sortFn = null;
					return;
				}

				if (sortedEl && sortedEl !== th)
					this.sortedByHeader.sortOrder = 'none';

				this.sortedByHeader = th;

				this.sortField = th.sortable;
				this.sortFn = order === 'none' ? null : this[order];
			},

			asc(a, b) {
				const field = this.sortField;
				return a[field] > b[field] ? 1 : -1;
			},

			desc(a, b) {
				const field = this.sortField;
				return a[field] > b[field] ? -1 : 1;
			},

			update() {
				const data = this.data,
					sortFn = this.sortFn;
				this.count = data ? data.length : 0;
				this.sortedData = sortFn
					? data.slice(0).sort(sortFn.bind(this))
					: data;
			}
		}
	);

	component(
		{
			name: 'cxl-pagination',
			attributes: ['rows', 'data', 'paginatedData', 'rowsOptions'],
			bindings: `=rows:#updatePage =data:#updatePage`,
			styles: {
				$: {
					paddingLeft: 8,
					paddingRight: 8,
					paddingTop: 4,
					paddingBottom: 4,
					textAlign: 'right'
				},
				rpp: {
					marginRight: 32,
					display: 'inline-block'
				},
				res: {
					display: 'none'
				},
				res$small: { display: 'inline' }
			},
			template: `
<cxl-t inline>Rows <x &=".res">per page:</x>&nbsp;</cxl-t>
<cxl-select inline &="=rows::value .rpp">
	<template &="=rowsOptions:marker.empty:each:repeat">
	<cxl-option &="$value:@value $label:text"></cxl-option>
	</template>
</cxl-select>
<cxl-t inline><span &="=pageStart:text"></span>-<span &="=pageEnd:text"></span> of <span &="=count:text"></span></cxl-t>
<cxl-button &="=disablePrev:@disabled action:#previusPage" flat round aria-label="Go To Previous Page"><cxl-icon icon="arrow-left"></cxl-icon></cxl-button>
<cxl-button &="=disableNext:@disabled action:#nextPage" flat round aria-label="Go To Next Page"><cxl-icon icon="arrow-right"></cxl-icon></cxl-button>
		`
		},
		{
			rows: 5,
			page: 0,
			count: 0,
			rowsOptions: [
				{ label: 5, value: 5 },
				{ label: 10, value: 10 },
				{ label: 25, value: 25 }
			],

			nextPage() {
				this.page += 1;
				this.updatePage();
			},

			previusPage() {
				this.page -= 1;
				this.updatePage();
			},

			updatePage() {
				const data = this.data;

				if (!data || !Array.isArray(data) || !this.rows) {
					this.page = this.count = this.pageStart = this.pageEnd = 0;
				} else {
					const count = (this.count = data.length);
					let pageStart = this.page * (this.rows - 1);

					if (pageStart > count) pageStart = this.page = 0;

					const pageEnd = pageStart + this.rows;

					this.count = data.length;
					this.pageStart = pageStart + 1;
					this.pageEnd = pageEnd > this.count ? this.count : pageEnd;
					this.disablePrev = this.page === 0;
					this.disableNext = this.pageEnd === this.count;

					this.paginatedData = data.slice(pageStart, pageEnd);
				}
			}
		}
	);
})(this.cxl);
