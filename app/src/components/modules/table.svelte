<script lang="ts">
	type Column = { key: string; label: string; width?: string }
	type Row = Record<string, any>

	export let columns: Column[] = []
	export let rows: Row[] = []
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				{#each columns as col}
					<th style={col.width ? `width: ${col.width}` : ""}>{col.label}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row}
				<tr>
					{#each columns as col}
						<td>{row[col.key] ?? ""}</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 12px 16px;
		text-align: left;
		border-bottom: 1px solid var(--border-color);
	}

	th {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-muted);
		background: var(--secondary-color);
	}

	td {
		font-size: 14px;
		color: var(--white);
	}

	tbody tr:hover {
		background: var(--secondary-color);
	}
</style>
