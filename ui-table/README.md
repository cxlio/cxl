# @cxl/ui-table 
	
[![npm version](https://badge.fury.io/js/%40cxl%2Fui-table.svg)](https://badge.fury.io/js/%40cxl%2Fui-table)

UI Table Components

## Project Details

-   Branch Version: [0.0.1](https://npmjs.com/package/@cxl/ui-table/v/0.0.1)
-   License: GPL-3.0
-   Documentation: [Link](https://cxlio.github.io/cxl/ui-table)

## Installation

	npm install @cxl/ui-table

## Usage

```demo
<cxl-table id="table">
<cxl-table-toolbar>
</cxl-table-toolbar>
	<cxl-tr>
		<cxl-th-checkbox></cxl-th-checkbox>
		<cxl-th>Name</cxl-th>
		<cxl-th>Tag Name</cxl-th>
		<cxl-th>Role</cxl-th>
		<cxl-th>Kind</cxl-th>
		<cxl-th>Flags</cxl-th>
		<cxl-th>Link</cxl-th>
	</cxl-tr>
	<cxl-table-pagination></cxl-table-pagination>
</cxl-table>
<script>
async function render() {
	const data = await fetch('../ui/summary.json').then(res => res.json());
	const table = document.getElementById('table');

	for (const row of data) {
		const tr = document.createElement('cxl-tr');
		tr.innerHTML = `
			<cxl-td-checkbox></cxl-td-checkbox>
			<cxl-td>${row.name}</cxl-td>
			<cxl-td>${row.docs?.tagName || ''}</cxl-td>
			<cxl-td>${row.docs?.role || ''}</cxl-td>
			<cxl-td>${row.kind}</cxl-td>
			<cxl-td>${row.flags}</cxl-td>
			<cxl-td><a target="_top" href="../ui/?${row.href}">Docs</a></cxl-td>
		`;
		table.appendChild(tr);
	}

	console.log(table);
}

render();
</script>
```
