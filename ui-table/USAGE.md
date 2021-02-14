## Usage

```demo
<cxl-datatable id="table">
	<cxl-tr>
		<cxl-th><cxl-table-select-all></cxl-table-select-all></cxl-th>
		<cxl-th>Name</cxl-th>
		<cxl-th>Tag Name</cxl-th>
		<cxl-th>Role</cxl-th>
		<cxl-th>Kind</cxl-th>
		<cxl-th>Flags</cxl-th>
		<cxl-th>Link</cxl-th>
	</cxl-tr>
	<cxl-tbody id="tbody"></cxl-tbody>
	<cxl-table-pagination></cxl-table-pagination>
</cxl-datatable>
<script>
async function render() {
	const data = await fetch('../ui/summary.json').then(res => res.json());
	const tbody = document.getElementById('tbody');

	for (const row of data) {
		const tr = document.createElement('cxl-tr-selectable');
		tr.innerHTML = `
			<cxl-td>${row.name}</cxl-td>
			<cxl-td>${row.docs?.tagName || ''}</cxl-td>
			<cxl-td>${row.docs?.role || ''}</cxl-td>
			<cxl-td>${row.kind}</cxl-td>
			<cxl-td>${row.flags}</cxl-td>
			<cxl-td><a target="_top" href="../ui/?${row.href}">Docs</a></cxl-td>
		`;
		tbody.appendChild(tr);
	}
}
render();
</script>
```
