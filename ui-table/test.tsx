import { spec } from '@cxl/spec';
import {
	Dataset,
	DataTable,
	TablePagination,
	Th,
	Tr,
	getPageCount,
	TrSelectable,
	TableSelectAll,
	TableSource,
	datasetRegistable,
} from './index.js';
import { dom } from '@cxl/tsx';
import { get } from '@cxl/component';
import { animationFrame } from '@cxl/dom';

export default spec('ui-table', s => {
	s.test('getPageCount()', it => {
		it.should('calculate last page correctly', a => {
			a.equal(getPageCount(100, 10), 9);
			a.equal(getPageCount(99, 10), 9);
			a.equal(getPageCount(101, 10), 10);
			a.equal(getPageCount(0, 10), 0);
			a.equal(getPageCount(0, 0), 0);
			a.equal(getPageCount(10, 0), 0);
			a.equal(getPageCount(10, 1), 9);
		});
	});

	s.test('Dataset', it => {
		it.should('register dataset registables', a => {
			const done = a.async();
			const source = ['one', 'two', 'three'];
			const dataset = (<Dataset source={source} />) as Dataset;
			a.dom.appendChild(dataset);

			datasetRegistable(dataset, action => {
				if (action.type !== 'update')
					a.equalValues(action.value, source);
				if (action.type === 'slice') done();
			}).subscribe();
		});
	});

	s.test('TableSelectAll', it => {
		const source = [
			{ name: 'one', order: 1 },
			{ name: 'two', order: 2 },
			{ name: 'three', order: 3 },
		];

		it.should(
			'be indeterminate when not all rows are selected',
			async a => {
				const table = (
					<DataTable source={source}>
						<TableSelectAll />
						<TrSelectable value={source[0]} />
						<TrSelectable value={source[1]} />
						<TrSelectable value={source[2]} />
					</DataTable>
				) as DataTable;
				const selectAll = table.children[0] as TableSelectAll;
				const tr1 = table.children[1] as TrSelectable;
				a.dom.appendChild(table);
				a.equal(table.selected.size, 0);
				tr1.selected = true;
				await animationFrame.first();
				a.equal(selectAll.checked, false);
				a.equal(selectAll.indeterminate, true);
			}
		);

		it.should('be checked when all rows are selected', async a => {
			const table = (
				<DataTable source={source}>
					<TableSelectAll />
					<TrSelectable value={source[0]} />
				</DataTable>
			) as DataTable;
			const selectAll = table.children[0] as TableSelectAll;
			const tr1 = table.children[1] as TrSelectable;
			a.dom.appendChild(table);
			tr1.selected = true;
			await animationFrame.first();
			a.equal(selectAll.checked, true);
			a.equal(selectAll.indeterminate, false);
		});

		it.should('select all rows when checked', async a => {
			const table = (
				<DataTable source={source}>
					<TableSelectAll />
					<TrSelectable value={source[0]} />
					<TrSelectable value={source[1]} />
					<TrSelectable value={source[2]} />
				</DataTable>
			) as DataTable;
			const selectAll = table.children[0] as TableSelectAll;
			a.dom.appendChild(table);
			a.equal(table.selected.size, 0);
			selectAll.click();
			await animationFrame.first();
			a.equal(selectAll.checked, true);
			a.equalValues(Array.from(table.selected), source);
		});

		it.should('select row if preselected', async a => {
			const table = (
				<DataTable source={source}>
					<TableSelectAll />
					<TrSelectable value={source[0]} />
				</DataTable>
			) as DataTable;
			const selectAll = table.children[0] as TableSelectAll;
			const tr1 = table.children[1] as TrSelectable;
			tr1.selected = true;
			a.dom.appendChild(table);
			await animationFrame.first();
			a.equal(selectAll.checked, true);
			a.equal(selectAll.indeterminate, false);
		});
	});

	s.test('TablePagination', it => {
		it.should('paginate empty set', async a => {
			const dataset = (
				<Dataset>
					<TablePagination rows={10} />
				</Dataset>
			) as Dataset;
			const pagination = dataset.children[0] as TablePagination;
			a.dom.appendChild(dataset);
			await animationFrame.first();
			a.equal(pagination.total, 0);
			a.equal(pagination.page, 0);
			pagination.goNext();
			await animationFrame.first();
			a.equal(pagination.total, 0);
			a.equal(pagination.page, 0);
			pagination.goLast();
			await animationFrame.first();
			a.equal(pagination.total, 0);
			a.equal(pagination.page, 0);
			pagination.goPrevious();
			await animationFrame.first();
			a.equal(pagination.total, 0);
			a.equal(pagination.page, 0);
			pagination.goFirst();
			await animationFrame.first();
			a.equal(pagination.total, 0);
			a.equal(pagination.page, 0);
		});

		it.should('paginate even dataset', async a => {
			const source = Array(100).map((_, i) => i);
			const dataset = (
				<Dataset source={source}>
					<TablePagination rows={10} />
				</Dataset>
			) as Dataset;
			const pagination = dataset.children[0] as TablePagination;
			a.dom.appendChild(dataset);
			await animationFrame.first();
			a.equal(pagination.rows, 10);
			a.equal(pagination.total, source.length);
			a.equal(pagination.page, 0);
			pagination.goNext();
			await animationFrame.first();
			a.equal(pagination.page, 1);
			(pagination.shadowRoot?.querySelectorAll(
				'cxl-icon-button'
			)[2] as HTMLElement).click();
			await animationFrame.first();
			a.equal(pagination.page, 2);
			(pagination.shadowRoot?.querySelectorAll(
				'cxl-icon-button'
			)[3] as HTMLElement).click();
			await animationFrame.first();
			a.equal(pagination.page, 9);
			a.equal(dataset.value.length, 10);
			pagination.goFirst();
			await animationFrame.first();
			a.equal(pagination.page, 0);
			a.equal(dataset.value.length, 10);
		});

		it.should('update rows displayed if value changed', async a => {
			const source = Array(100).map((_, i) => i);
			const dataset = (
				<Dataset source={source}>
					<TablePagination />
				</Dataset>
			) as Dataset;
			const pagination = dataset.children[0] as TablePagination;
			a.dom.appendChild(dataset);
			await animationFrame.first();
			a.equal(pagination.rows, 5);
			pagination.rows = 25;
			await animationFrame.first();
			a.equal(pagination.rows, 25);
			a.equal(dataset.value.length, 25);
		});

		it.should(
			'update rows displayed if value is changed from select box',
			async a => {
				const source = Array(100).map((_, i) => i);
				const dataset = (
					<Dataset source={source}>
						<TablePagination />
					</Dataset>
				) as Dataset;
				const pagination = dataset.children[0] as TablePagination;
				a.dom.appendChild(dataset);
				const select = pagination.shadowRoot?.querySelector(
					'cxl-select'
				) as any;
				await animationFrame.first();
				a.equal(pagination.rows, 5);
				select.value = 25;
				await animationFrame.first();
				a.equal(pagination.rows, 25);
				a.equal(dataset.value.length, 25);
			}
		);
	});

	s.test('TrSelectable', it => {
		const source = [
			{ name: 'one', order: 1 },
			{ name: 'two', order: 2 },
			{ name: 'three', order: 3 },
		];
		it.should('keep track of selectable rows', a => {
			const table = (
				<DataTable source={source}>
					<TrSelectable value={source[0]} />
					<TrSelectable value={source[1]} />
					<TrSelectable value={source[2]} />
				</DataTable>
			) as DataTable;
			// const selectAll = table.children[0] as TrSelectableAll;
			const tr0 = table.children[0] as TrSelectable;
			const tr1 = table.children[1] as TrSelectable;
			const tr2 = table.children[2] as TrSelectable;
			a.dom.appendChild(table);
			a.equal(table.selected.size, 0);
			a.equal(tr0.selected, false);
			a.equal(tr1.selected, false);
			a.equal(tr2.selected, false);
			tr0.selected = true;
			a.equalValues(Array.from(table.selected), [tr0.value]);
			a.equalValues(Array.from(table.selected), [source[0]]);
			tr1.selected = true;
			a.equalValues(Array.from(table.selected), [source[0], source[1]]);
			tr2.selected = true;
			a.equalValues(Array.from(table.selected), source);
			tr2.selected = false;
			a.equalValues(Array.from(table.selected), [source[0], source[1]]);
			tr1.selected = false;
			a.equalValues(Array.from(table.selected), [source[0]]);
			tr0.selected = false;
			a.equal(table.selected.size, 0);
		});

		it.should('update when dataset state changes', async a => {
			const table = (
				<DataTable source={source}>
					<TrSelectable value={source[1]} />
				</DataTable>
			) as DataTable;
			const tr = table.children[0] as TrSelectable;
			a.dom.appendChild(table);
			a.equal(table.selected.size, 0);
			a.equal(tr.selected, false);
			tr.selected = true;
			await animationFrame.first();
			tr.remove();
			a.equal(table.selected.size, 1);

			const tr2 = (<TrSelectable value={source[1]} />) as TrSelectable;
			table.appendChild(tr2);
			await animationFrame.first();
			a.equal(table.selected.size, 1);
			a.equal(tr2.selected, true);
		});
	});

	s.test('Th', it => {
		it.should('toggle between sortable states', a => {
			const el = (<Th sortable />) as Th;
			a.dom.appendChild(el);

			a.equal(el.sort, 'none');
			el.click();
			a.equal(el.sort, 'asc');
			el.click();
			a.equal(el.sort, 'desc');
			el.click();
			a.equal(el.sort, 'none');
		});

		it.should('sync up with other Th', a => {
			const done = a.async();
			let event = 0;
			const source = [
				{ name: 'one', order: 1 },
				{ name: 'two', order: 2 },
				{ name: 'three', order: 3 },
			];

			function onValue(val: any) {
				switch (event++) {
					case 1:
						a.equalValues(val, source);
						th0.click();
						break;
					case 2:
						a.equal(val[0], source[0]);
						a.equal(val[1], source[2]);
						a.equal(val[2], source[1]);
						a.equal(th1.sort, 'none');
						th1.sort = 'desc';
						break;
					case 3:
						a.equal(val[0], source[2]);
						a.equal(val[1], source[1]);
						a.equal(val[2], source[0]);
						a.equal(th0.sort, 'none');
						a.equal(th1.sort, 'desc');
						th0.sort = 'desc';
						break;
					case 4:
						a.equal(val[0], source[1]);
						a.equal(val[1], source[2]);
						a.equal(val[2], source[0]);
						a.equal(th0.sort, 'desc');
						a.equal(th1.sort, 'none');
						th0.sort = 'asc';
						break;
					case 5:
						a.equal(val[0], source[0]);
						a.equal(val[1], source[2]);
						a.equal(val[2], source[1]);
						a.equal(th0.sort, 'asc');
						a.equal(th1.sort, 'none');
						done();
				}
			}

			const dataset = (
				<Dataset
					$={el => get(el, 'value').tap(onValue)}
					source={source}
				>
					<Th sortable field="name">
						One
					</Th>
					<Th sortable field="order">
						Two
					</Th>
				</Dataset>
			) as Dataset;
			const th0 = dataset.children[0] as Th;
			const th1 = dataset.children[1] as Th;

			a.dom.appendChild(dataset);
		});
	});

	s.test('TableSource', it => {
		const source = [
			{ name: 'one', order: 1 },
			{ name: 'two', order: 2 },
			{ name: 'three', order: 3 },
		];
		it.should('set the dataset source based on its children', a => {
			const dataset = (
				<Dataset>
					<TableSource>
						<Tr value={source[0]}></Tr>
						<Tr value={source[1]}></Tr>
						<Tr value={source[2]}></Tr>
					</TableSource>
				</Dataset>
			) as Dataset;
			a.dom.appendChild(dataset);
			a.equalValues(dataset.source, source);
		});
	});
});
