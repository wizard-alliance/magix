<script lang="ts">
	import { createEventDispatcher, tick, onMount } from "svelte"
	import Avatar from "$components/modules/avatar.svelte"
	import Badge from "$components/modules/badge.svelte"
	import DateString from "$components/modules/DateString.svelte"
	import Pagination from "$components/modules/pagination.svelte"
	import DropdownMenu from "$components/modules/DropdownMenu.svelte"

	export let rows: Record<string, any>[] = []
	export let stickyColumns: number[] = []
	export let scrollable: `x` | `y` | null = null
	export let responsive: boolean = true
	export let pagination: number = 0
	export let totalRows: number = 0
	export let colActions: { name: string; icon: string; event: string }[] = []

	const dispatch = createEventDispatcher<{
		pageChange: { page: number; limit: number }
		action: { event: string; row: Record<string, any>; index: number }
	}>()

	let page = 1

	$: dataColumns = rows.length ? Object.keys(rows[0]) : []
	$: columns = colActions.length ? [...dataColumns, `Actions`] : dataColumns
	$: total = totalRows || rows.length
	$: totalPages = pagination > 0 ? Math.ceil(total / pagination) || 1 : 1
	$: displayRows = pagination > 0 && !totalRows ? rows.slice((page - 1) * pagination, page * pagination) : rows
	$: showFrom = pagination > 0 ? (page - 1) * pagination + 1 : 1
	$: showTo = pagination > 0 ? Math.min(page * pagination, total) : total
	$: stickySet = new Set(stickyColumns)

	let headerCells: HTMLElement[] = []
	let stickyOffsets: number[] = []

	onMount(() => {
		computeOffsets()
	})

	async function computeOffsets() {
		await tick()
		await tick()
		const widths = headerCells.map((el) => el?.offsetWidth ?? 0)
		const offsets: number[] = []
		for (let i = 0; i < widths.length; i++) {
			let left = 0
			for (let c = 0; c < i; c++) {
				if (stickySet.has(c)) left += widths[c]
			}
			offsets.push(left)
		}
		stickyOffsets = offsets
	}

	$: if (columns.length && headerCells.length) computeOffsets()

	let scrolled = false
	let actionOpen: number | null = null
	let actionTriggers: HTMLElement[] = []

	function onGridScroll(e: Event) {
		scrolled = (e.target as HTMLElement).scrollLeft > 5
	}

	function onPageChange(e: CustomEvent<number>) {
		page = e.detail
		dispatch(`pageChange`, { page, limit: pagination })
	}

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

<div class="advanced-table" class:responsive class:scrollable-x={scrollable === `x`} class:scrollable-y={scrollable === `y`}>
	{#if columns.length}
		<div class="table-grid" class:scrolled style:--cols={columns.length} on:scroll={onGridScroll}>
			<!-- Header -->
			{#each columns as col, i}
				<div
					bind:this={headerCells[i]}
					class="table-col table-col-key table-col-{i}"
					class:sticky={stickySet.has(i)}
					style:left={stickySet.has(i) ? `${stickyOffsets[i] ?? 0}px` : undefined}
				>
					{col}
				</div>
			{/each}

			<!-- Rows -->
			{#each displayRows as row, rowIndex}
				<div class="table-row">
					{#each columns as col, i}
						{#if col === `Actions`}
							<div
								class="table-col table-col-value table-col-actions table-col-{i}"
								class:sticky={stickySet.has(i)}
								style:left={stickySet.has(i) ? `${stickyOffsets[i] ?? 0}px` : undefined}
							>
								<div class="action-wrapper">
									<button
										bind:this={actionTriggers[rowIndex]}
										class="action-trigger"
										title="Actions"
										on:click={() => (actionOpen = actionOpen === rowIndex ? null : rowIndex)}
									>
										<i class="fa-light fa-ellipsis-vertical"></i>
									</button>
									<DropdownMenu open={actionOpen === rowIndex} triggerRef={actionTriggers[rowIndex]} anchor="right">
										{#each colActions as action}
											<button
												on:click={() => {
													actionOpen = null
													dispatch(`action`, { event: action.event, row, index: rowIndex })
												}}
											>
												<i class={action.icon}></i>
												{action.name}
											</button>
										{/each}
									</DropdownMenu>
								</div>
							</div>
						{:else}
							<div
								class="table-col table-col-value table-col-{i}"
								class:sticky={stickySet.has(i)}
								style:left={stickySet.has(i) ? `${stickyOffsets[i] ?? 0}px` : undefined}
								data-label={col}
							>
								{#if isAvatar(col) && row[col]}
									<Avatar name={row[col]?.name ?? ``} src={row[col]?.src ?? ``} size="sm" />
								{:else if isBool(row[col])}
									<Badge text={row[col] ? `Yes` : `No`} variant={row[col] ? `success` : `danger`} />
								{:else if isDate(col) && row[col]}
									<DateString value={row[col]} />
								{:else if isUrl(row[col])}
									<a href={row[col]} target="_blank" rel="noopener noreferrer">{row[col]}</a>
								{:else}
									{formatValue(col, row[col])}
								{/if}
							</div>
						{/if}
					{/each}
				</div>
			{/each}
		</div>

		<!-- Footer -->
		{#if pagination > 0}
			<div class="table-footer">
				<span class="table-summary">Showing {showFrom} to {showTo} of {total}</span>
				{#if totalPages > 1}
					<Pagination current={page} total={totalPages} on:change={onPageChange} />
				{/if}
			</div>
		{/if}
	{:else}
		<p class="muted-color">No data</p>
	{/if}
</div>

<style lang="scss" scoped>
	.advanced-table {
		width: 100%;
		overflow: hidden;
		background-color: var(--tertiary-color);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 1);

		&.scrollable-x {
			.table-grid {
				overflow-x: auto;
				overflow-y: hidden;
			}
		}
		&.scrollable-y {
			.table-grid {
				overflow-y: auto;
				overflow-x: hidden;
				max-height: 70vh;
			}
		}
	}

	.table-grid {
		display: grid;
		grid-template-columns: repeat(var(--cols), minmax(min-content, 1fr));
	}

	.table-col {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 250px;
		min-width: 80px;
		padding: calc(var(--gutter) * 2) calc(var(--gutter) * 2);

		&.sticky {
			position: sticky;
			z-index: 1;
			transition: background var(--animationDefaultSpeed) var(--animationEasing);
		}

		.scrolled &.sticky {
			background-color: color-mix(in srgb, var(--quaternary-color) 70%, var(--primary-color));
		}

		&.table-col-key {
			font-size: var(--font-size-small);
			font-weight: 500;
			color: var(--muted-color);
			border-bottom: 1px solid var(--border-color);

			&.sticky {
				z-index: 2;
			}
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

		&.table-col-actions {
			display: flex;
			align-items: center;
			overflow: visible;
		}
	}

	.action-wrapper {
		position: relative;
	}

	.action-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border-radius: 6px;
		border: none;
		background: transparent;
		color: var(--muted-color);
		font-size: var(--font-size);
		cursor: pointer;
		transition:
			background var(--animationDefaultSpeed) var(--animationEasing),
			color var(--animationDefaultSpeed) var(--animationEasing);

		&:hover {
			background-color: var(--quaternary-color);
			color: var(--white);
		}
	}

	.table-row {
		display: grid;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;

		&:hover .table-col-value {
			background-color: var(--secondary-color);
		}
		&:hover .table-col-value.sticky {
			background-color: var(--tertiary-color);
		}
	}

	.table-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: calc(var(--gutter) * 2) calc(var(--gutter) * 2) calc(var(--gutter) * 0.5);
	}

	.table-summary {
		font-size: var(--font-size-small);
		color: var(--muted-color);
	}

	/* Responsive card mode */
	@media (max-width: 40rem) {
		.advanced-table.responsive {
			.table-grid {
				display: flex;
				flex-direction: column;
				gap: calc(var(--gutter) * 2);
				overflow: visible;
			}

			.table-col-key {
				display: none;
			}

			.table-row {
				display: flex;
				flex-direction: column;
				background: var(--secondary-color);
				border-radius: 8px;
				padding: calc(var(--gutter) * 1.5);
				gap: calc(var(--gutter) * 0.75);
			}

			.table-col.table-col-value {
				max-width: none;
				min-width: 0;
				border-bottom: none;
				padding: calc(var(--gutter) * 0.5) 0;
				white-space: normal;

				&::before {
					content: attr(data-label);
					display: inline-block;
					min-width: 80px;
					font-weight: 500;
					color: var(--muted-color);
					margin-right: calc(var(--gutter) * 1);
					flex-shrink: 0;
				}

				&.table-col-actions::before {
					content: none;
				}

				&.sticky {
					position: static;
				}
			}
		}
	}
</style>
