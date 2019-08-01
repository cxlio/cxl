(cxl => {
	'use strict';
	const Undefined = cxl.Undefined,
		component = cxl.component;

	/*component(
		{
			name: 'cxl-table',
			bindings: 'registable.host(table):=event =event:#updateColumns',
			styles: {
				$: { display: 'grid', overflowX: 'auto' }
			}
		},
		{
			event: Undefined,
			columns: 0,
			updateColumns(set, table) {
				if (set) {
					let columns = '';

					for (let th of set) columns += (th.width || 'auto') + ' ';

					table.style.gridTemplateColumns = columns;
				}
			}
		}
	);*/

	component({
		name: 'cxl-table',
		bindings: 'role(table)',
		styles: {
			$: { display: 'table', width: '100%' }
		}
	});

	component(
		{
			name: 'cxl-th',
			events: ['table.sort'],
			attributes: ['width', 'sortable', 'sort'],
			bindings:
				'role(columnheader) =width:style.inline(width) action:#onAction',
			template: `
	<cxl-icon &="=sortable:show .sortIcon =sort:style:host.trigger(table.sort)" icon="arrow-up"></cxl-icon><span &="content"></span>
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
					lineHeight: 24
				},
				$sortable: { cursor: 'pointer' },
				sortIcon: {
					display: 'none',
					marginLeft: -16,
					marginRight: 8,
					scaleY: 0,
					scaleX: 0
				},
				sortIcon$sortable: {
					display: 'inline-block'
				},
				asc: { rotate: 0, scaleX: 1, scaleY: 1 },
				desc: {
					rotate: '180deg',
					scaleX: 1,
					scaleY: 1
				}
			}
		},
		{
			sort: 'none',

			toggleSort() {
				const sort = this.sort;
				this.sort =
					sort === 'asc' ? 'desc' : sort === 'desc' ? 'none' : 'asc';
			},
			onAction() {
				if (this.sortable) this.toggleSort();
			}
		}
	);

	component({
		name: 'cxl-td',
		bindings: 'role(cell)',
		styles: {
			$: {
				display: 'table-cell',
				paddingTop: 12,
				paddingBottom: 12,
				paddingLeft: 8,
				paddingRight: 8,
				flexGrow: 1,
				borderBottom: '1px solid',
				borderColor: 'divider'
			},
			$primary: { backgroundColor: 'primary', color: 'onPrimary' },
			$secondary: { backgroundColor: 'secondary', color: 'onSecondary' }
		}
	});

	component({
		name: 'cxl-tr',
		bindings: 'role(row)',
		styles: {
			$: { display: 'table-row' }
		}
	});

	component(
		{
			name: 'cxl-datatable',
			extend: 'cxl-table',
			bindings: '=data:#update on(table.sort):#onSort',
			attributes: ['data', 'rows', 'page'],
			styles: {
				row: { display: 'table-row' }
			}
		},
		{
			rows: 5,
			page: 0,
			sortedByHeader: null,

			onSort(ev) {
				if (ev.detail === 'none') return;

				if (this.sortedByHeader && this.sortedByHeader !== ev.target)
					this.sortedByHeader.sort = 'none';

				this.sortedByHeader = ev.target;
			},

			update() {
				const data = this.data;
				this.count = data ? data.length : 0;
				this.displayData = data;
			}
		}
	);

	component(
		{
			name: 'cxl-pagination',
			attributes: ['rows', 'data', 'paginatedData'],
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
					marginRight: 32
				}
			},
			template: `
Rows per page: <span &="=rows:text .rpp"></span>
<span &="=pageStart:text"></span>-<span &="=pageEnd:text"></span> of <span &="=count:text"></span>
<cxl-button &="=disablePrev:@disabled action:#previusPage" flat round aria-label="Go To Previous Page"><cxl-icon icon="arrow-left"></cxl-icon></cxl-button>
<cxl-button &="=disableNext:@disabled action:#nextPage" flat round aria-label="Go To Next Page"><cxl-icon icon="arrow-right"></cxl-icon></cxl-button>
		`
		},
		{
			rows: 5,
			page: 0,
			count: 0,

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

				if (!data || !Array.isArray(data)) {
					this.page = this.count = this.pageStart = this.pageEnd = 0;
				} else {
					const pageStart = this.page * (this.rows - 1);
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
