(cxl => {
	'use strict';
	const Undefined = cxl.Undefined,
		component = cxl.component;

	component({
		name: 'cxl-datatable'
	});

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
		bindings: 'role(table) registable.host(table)',
		styles: {
			$: { display: 'table', width: '100%' }
		}
	});

	component({
		name: 'cxl-th',
		attributes: ['width'],
		bindings:
			'registable(table) role(columnheader) =width:style.inline(width)',
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
			}
		}
	});

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
})(this.cxl);
