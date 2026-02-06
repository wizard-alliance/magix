<script lang="ts">
	import { createEventDispatcher } from "svelte"
	import Button from "$components/fields/button.svelte"

	const dispatch = createEventDispatcher<{
		add: { item: any; index: number }
		remove: { item: any; index: number }
		duplicate: { item: any; index: number }
		change: { items: any[] }
	}>()

	export let title = "Repeater"
	export let items: any[] = []
	export let addLabel = "Add row"
	export let emptyLabel = "No entries yet"
	export let minRows: number | null = null
	export let maxRows: number | null = null
	export let collapsible = true
	export let defaultExpanded = false
	export let getRowLabel: ((item: any, index: number) => string) | null = null
	export let createRow: (() => any) | null = null

	// auto-derive a blank row from the first item's shape
	const deriveRow = () => {
		const template = items[0]
		if (!template || typeof template !== `object`) return {}
		const row: Record<string, any> = {}
		for (const key of Object.keys(template)) {
			const val = template[key]
			if (typeof val === `string`) row[key] = ``
			else if (typeof val === `number`) row[key] = 0
			else if (typeof val === `boolean`) row[key] = false
			else row[key] = null
		}
		return row
	}

	// stable IDs via counter — simple and bulletproof
	let nextId = 0
	let rowIds: number[] = items.map(() => nextId++)

	// keep rowIds in sync when items change externally
	$: {
		while (rowIds.length < items.length) rowIds.push(nextId++)
		if (rowIds.length > items.length) rowIds = rowIds.slice(0, items.length)
	}

	// collapse: only explicit overrides stored, fallback to !defaultExpanded
	let open: Record<number, boolean> = {}

	const isOpen = (rid: number) => open[rid] ?? defaultExpanded

	const toggle = (rid: number) => {
		if (!collapsible) return
		open = { ...open, [rid]: !isOpen(rid) }
	}

	$: atLimit = maxRows !== null && items.length >= maxRows
	$: atMin = minRows !== null && items.length <= minRows

	const addRow = () => {
		if (atLimit) return
		const row = createRow ? createRow() : deriveRow()
		const rid = nextId++
		items = [...items, row]
		rowIds = [...rowIds, rid]
		open = { ...open, [rid]: true }
		dispatch(`add`, { item: row, index: items.length - 1 })
		dispatch(`change`, { items })
	}

	const removeRow = (index: number) => {
		if (atMin) return
		const item = items[index]
		items = items.filter((_, i) => i !== index)
		rowIds = rowIds.filter((_, i) => i !== index)
		dispatch(`remove`, { item, index })
		dispatch(`change`, { items })
	}

	const duplicateRow = (index: number) => {
		if (atLimit) return
		const copy = { ...items[index] }
		const rid = nextId++
		items = [...items.slice(0, index + 1), copy, ...items.slice(index + 1)]
		rowIds = [...rowIds.slice(0, index + 1), rid, ...rowIds.slice(index + 1)]
		open = { ...open, [rid]: true }
		dispatch(`duplicate`, { item: copy, index: index + 1 })
		dispatch(`change`, { items })
	}

	const onHeaderClick = (e: MouseEvent, rid: number) => {
		if ((e.target as HTMLElement)?.closest?.(`.rpt-actions`)) return
		toggle(rid)
	}
</script>

<div class="rpt">
	<div class="rpt-top">
		<div class="rpt-title">
			<span>{title}</span>
			{#if maxRows !== null}
				<span class="rpt-count">{items.length}/{maxRows}</span>
			{/if}
		</div>
		<Button variant="secondary" size="sm" disabled={atLimit} on:click={addRow}>
			<i class="fa-light fa-plus"></i> <span>{addLabel}</span>
		</Button>
	</div>

	{#if !items.length}
		<div class="rpt-empty">{emptyLabel}</div>
	{/if}

	{#each items as item, index (rowIds[index])}
		{@const rid = rowIds[index]}
		{@const expanded = !collapsible || (open[rid] ?? defaultExpanded)}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_static_element_interactions a11y_click_events_have_key_events -->
		<div class="rpt-row" class:is-open={expanded}>
			<div
				class="rpt-header"
				tabindex={collapsible ? 0 : -1}
				on:click={(e) => onHeaderClick(e, rid)}
				on:keydown={(e) => (e.key === `Enter` || e.key === ` `) && (e.preventDefault(), toggle(rid))}
			>
				{#if collapsible}
					<i class="rpt-chevron fa-light fa-chevron-right" class:is-open={expanded}></i>
				{/if}
				<span class="rpt-label">
					{#if getRowLabel}{getRowLabel(item, index)}{:else}#{index + 1}{/if}
				</span>
				<div class="rpt-actions">
					<button type="button" title="Duplicate" disabled={atLimit} on:click|stopPropagation={() => duplicateRow(index)}>
						<i class="fa-light fa-copy"></i>
					</button>
					<button type="button" class="danger" title="Remove" disabled={atMin} on:click|stopPropagation={() => removeRow(index)}>
						<i class="fa-light fa-trash"></i>
					</button>
				</div>
			</div>
			{#if expanded}
				<div class="rpt-body row middle-xs">
					<slot {item} {index} rowId={rid} />
				</div>
			{:else}
				<div class="rpt-body row middle-xs" style="display:none">
					<slot {item} {index} rowId={rid} />
				</div>
			{/if}
		</div>
	{/each}
</div>

<style lang="scss">
	.rpt {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 1.5);
		width: 100%;
	}

	.rpt-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.rpt-title {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 1);
		font-size: var(--font-size);
		font-weight: 600;
	}

	.rpt-count {
		font-size: var(--font-size-small);
		color: var(--muted-color-2);
		font-weight: 400;
	}

	.rpt-empty {
		padding: calc(var(--gutter) * 3);
		text-align: center;
		border: 1px dashed var(--border-color);
		border-radius: var(--border-radius);
		color: var(--muted-color-2);
		font-size: var(--font-size-small);
	}

	.rpt-row {
		border: var(--border);
		border-radius: var(--border-radius);
		overflow: hidden;
	}

	.rpt-header {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 0.75);
		padding: calc(var(--gutter) * 0.75) calc(var(--gutter) * 1.25);
		cursor: pointer;
		user-select: none;

		&:hover {
			background: rgba(255, 255, 255, 0.02);
		}
	}

	.rpt-chevron {
		font-size: 0.65rem;
		color: var(--muted-color-2);
		transition: transform 150ms ease;
		&.is-open {
			transform: rotate(90deg);
		}
	}

	.rpt-label {
		flex: 1;
		font-size: var(--font-size-small);
		color: var(--muted-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.rpt-actions {
		display: flex;
		gap: 2px;

		button {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 22px;
			height: 22px;
			border: none;
			border-radius: 4px;
			background: transparent;
			color: var(--muted-color-2);
			cursor: pointer;
			font-size: 0.75rem;

			&:hover {
				background: rgba(255, 255, 255, 0.06);
				color: var(--white);
			}
			&.danger:hover {
				background: rgba(255, 107, 132, 0.1);
				color: var(--red);
			}
			&:disabled {
				opacity: 0.25;
				cursor: not-allowed;
			}
		}
	}

	.rpt-body {
		padding: calc(var(--gutter) * 1.5);
		border-top: var(--border);
	}
</style>
