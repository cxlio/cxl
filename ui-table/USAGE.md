## Usage

### Static Table

```demo
<cxl-table>
	<cxl-tr>
		<cxl-th>Name</cxl-th>
		<cxl-th>Tag Name</cxl-th>
		<cxl-th>Role</cxl-th>
		<cxl-th>Kind</cxl-th>
		<cxl-th>Flags</cxl-th>
		<cxl-th>Link</cxl-th>
	</cxl-tr>
	<cxl-tr>
		<cxl-td>alert</cxl-td>
		<cxl-td></cxl-td>
		<cxl-td></cxl-td>
		<cxl-td>16</cxl-td>
		<cxl-td>1</cxl-td>
		<cxl-td><a target="_top" href="../ui/?undefined">Docs</a></cxl-td>
	</cxl-tr><cxl-tr>
		<cxl-td>Appbar</cxl-td>
		<cxl-td>cxl-appbar</cxl-td>
		<cxl-td>heading</cxl-td>
		<cxl-td>35</cxl-td>
		<cxl-td>1</cxl-td>
		<cxl-td><a target="_top" href="../ui/?undefined">Docs</a></cxl-td>
	</cxl-tr><cxl-tr>
		<cxl-td>AppbarContextual</cxl-td>
		<cxl-td>cxl-appbar-contextual</cxl-td>
		<cxl-td></cxl-td>
		<cxl-td>35</cxl-td>
		<cxl-td>1</cxl-td>
		<cxl-td><a target="_top" href="../ui/?undefined">Docs</a></cxl-td>
	</cxl-tr><cxl-tr>
		<cxl-td>AppbarSearch</cxl-td>
		<cxl-td>cxl-appbar-search</cxl-td>
		<cxl-td></cxl-td>
		<cxl-td>35</cxl-td>
		<cxl-td>1</cxl-td>
		<cxl-td><a target="_top" href="../ui/?undefined">Docs</a></cxl-td>
	</cxl-tr><cxl-tr>
		<cxl-td>AppbarTitle</cxl-td>
		<cxl-td>cxl-appbar-title</cxl-td>
		<cxl-td></cxl-td>
		<cxl-td>35</cxl-td>
		<cxl-td>1</cxl-td>
		<cxl-td><a target="_top" href="../ui/?undefined">Docs</a></cxl-td>
	</cxl-tr>
</cxl-table>
```

### DataTable with Static Rows

```demo
<cxl-datatable id="table">
	<cxl-tr>
		<cxl-th>
			<cxl-table-select-all></cxl-table-select-all>
		</cxl-th>
		<cxl-th sortable sort="asc" field="name">Name</cxl-th>
		<cxl-th sortable field="tagName">Tag Name</cxl-th>
		<cxl-th sortable field="role">Role</cxl-th>
		<cxl-th>Kind</cxl-th>
		<cxl-th>Flags</cxl-th>
		<cxl-th>Link</cxl-th>
	</cxl-tr>
	<cxl-table-source id="tbody"></cxl-table-source>
	<cxl-table-pagination slot="footer"></cxl-table-pagination>
</cxl-datatable>
<script>
	(async () => {
		const data = (
			await fetch('summary.json').then(res => res.json())
		).map(r => ({
			name: r.name,
			tagName: r.docs?.tagName || '',
			role: r.docs?.role || '',
			kind: r.kind,
			flags: r.flags,
		}));
		const tbody = document.getElementById('tbody');

		function renderRow(row) {
			const tr = document.createElement('cxl-tr-selectable');
			tr.value = row;
			tr.innerHTML = `
				<cxl-td>${row.name}</cxl-td>
				<cxl-td>${row.tagName}</cxl-td>
				<cxl-td>${row.role}</cxl-td>
				<cxl-td>${row.kind}</cxl-td>
				<cxl-td>${row.flags}</cxl-td>
				<cxl-td><a target="_top" href="../ui/?${row.href}">Docs</a></cxl-td>
			`;
			return tr;
		}

		for (const row of data) tbody.appendChild(renderRow(row));
	})();
</script>
```

### Dynamic Table

```demo
<cxl-dataset id="table">
	<cxl-table>
		<cxl-tr>
			<cxl-th>
				<cxl-table-select-all></cxl-table-select-all>
			</cxl-th>
			<cxl-th sortable sort="asc" field="name">Name</cxl-th>
			<cxl-th sortable field="tagName">Tag Name</cxl-th>
			<cxl-th sortable field="role">Role</cxl-th>
			<cxl-th>Kind</cxl-th>
			<cxl-th>Flags</cxl-th>
			<cxl-th>Link</cxl-th>
		</cxl-tr>
		<cxl-tbody id="tbody"></cxl-tbody>
	</cxl-table>
	<cxl-table-pagination></cxl-table-pagination>
</cxl-dataset>
<script>
	(async () => {
		const data = (
			await fetch('summary.json').then(res => res.json())
		).map(r => ({
			name: r.name,
			tagName: r.docs?.tagName || '',
			role: r.docs?.role || '',
			kind: r.kind,
			flags: r.flags,
		}));
		const tbody = document.getElementById('tbody');

		function renderRow(row) {
			const tr = document.createElement('cxl-tr-selectable');
			tr.value = row;
			tr.innerHTML = `
				<cxl-td>${row.name}</cxl-td>
				<cxl-td>${row.tagName}</cxl-td>
				<cxl-td>${row.role}</cxl-td>
				<cxl-td>${row.kind}</cxl-td>
				<cxl-td>${row.flags}</cxl-td>
				<cxl-td><a target="_top" href="../ui/?${row.href}">Docs</a></cxl-td>
			`;
			return tr;
		}

		table.addEventListener('change', ev => {
			const data = table.value;
			tbody.innerHTML = '';
			for (const row of data) tbody.appendChild(renderRow(row));
		});

		table.source = data;
	})();
</script>
```
