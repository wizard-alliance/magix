<script lang="ts">
	import Avatar from "$components/modules/avatar.svelte"
	import Badge from "$components/modules/badge.svelte"

	export let rows: Record<string, any>[] = []

	$: columns = rows.length ? Object.keys(rows[0]) : []

	const isAvatar = (key: string) => key.toLowerCase().includes(`avatar`)
	const isUrl = (value: any) => typeof value === `string` && (value.startsWith(`http://`) || value.startsWith(`https://`))
	const isBool = (value: any) => typeof value === `boolean`
	const isDate = (key: string) => [`date`, `created`, `updated`].some((d) => key.toLowerCase().includes(d))

	const formatValue = (key: string, value: any): string => {
		if (value === null || value === undefined) return `—`
		if (isAvatar(key) || isUrl(value) || isBool(value)) return ``

		if (isDate(key) && value) {
			const date = new Date(value)
			if (!isNaN(date.getTime())) return date.toLocaleDateString()
		}

		if (Array.isArray(value)) return value.join(`, `)
		if (typeof value === `object`) return JSON.stringify(value)

		return String(value)
	}
</script>

<div class="advanced-table" style:--cols={columns.length}>
	{#if columns.length}
		{#each columns as col, i}
			<div class="table-col table-col-key table-col-{i}">{col}</div>
		{/each}

		{#each rows as row}
			<div class="table-row">
				{#each columns as col, i}
					<div class="table-col table-col-value table-col-{i}">
						{#if isAvatar(col) && row[col]}
							<Avatar name={row[col]?.name ?? ``} src={row[col]?.src ?? ``} size="sm" />
						{:else if isBool(row[col])}
							<Badge text={row[col] ? `Yes` : `No`} variant={row[col] ? `success` : `danger`} />
						{:else if isUrl(row[col])}
							<a href={row[col]} target="_blank" rel="noopener noreferrer">{row[col]}</a>
						{:else}
							{formatValue(col, row[col])}
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	{:else}
		<p class="muted-color">No data</p>
	{/if}
</div>

<style lang="scss" scoped>
	.advanced-table {
		width: 100%;
		display: grid;
		grid-template-columns: repeat(var(--cols), minmax(max-content, 0fr));
		background-color: var(--tertiary-color);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 1);
	}

	.table-col {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: calc(var(--gutter) * 1.5) calc(var(--gutter) * 2);

		&.table-col-key {
			font-size: var(--font-size-small);
			font-weight: 500;
			color: var(--muted-color);
			border-bottom: 1px solid var(--border-color);
		}
		&.table-col-value {
			display: flex;
			align-items: center;

			font-size: var(--font-size-small);
			border-bottom: 1px solid var(--border-color);

			&.table-col-0 {
				font-weight: 700;
			}
		}
	}

	.table-row {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;

		&:hover .table-col-value {
			background-color: var(--tertiary-color);
		}
	}
</style>
