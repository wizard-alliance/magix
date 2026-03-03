<script lang="ts">
	import { app } from "$lib/app"
	import { onMount, onDestroy } from "svelte"
	import type { BillingSubscription } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"
	import SearchInput from "$components/fields/searchInput.svelte"
	import Select from "$components/fields/select.svelte"

	let loading = true
	let filtering = false
	let subscriptions: any[] = []
	let mounted = false

	// Filter state
	let searchQuery = ``
	let filterStatus = ``

	const statusOptions = [
		{ label: `All Statuses`, value: `` },
		{ label: `Active`, value: `active` },
		{ label: `Paused`, value: `paused` },
		{ label: `Past Due`, value: `past_due` },
		{ label: `Canceled`, value: `cancelled` },
		{ label: `Expired`, value: `expired` },
	]

	let debounceTimer: ReturnType<typeof setTimeout>

	const createTableData = (raw: BillingSubscription[]) =>
		raw.map((s) => ({
			ID: s.id,
			Plan: s.planName ?? `—`,
			Customer: s.customerName ? `${s.customerName} (#${s.customerId})` : `#${s.customerId}`,
			Status: s.status,
			"Period Start": s.currentPeriodStart ?? `—`,
			"Period End": s.currentPeriodEnd ?? `—`,
			Created: s.created ?? `—`,
		}))

	const loadData = async () => {
		filtering = true
		try {
			const query: Record<string, any> = {}
			if (searchQuery) query.search = searchQuery
			if (filterStatus) query.status = filterStatus
			const data = await app.Commerce.Subscriptions.list(query)
			subscriptions = createTableData(data)
		} catch {
			app.UI.Notify.error(`Failed to load subscriptions`, `Subscriptions`)
		} finally {
			loading = false
			filtering = false
		}
	}

	const applyFilters = (debounce = 0) => {
		clearTimeout(debounceTimer)
		if (debounce > 0) {
			debounceTimer = setTimeout(() => loadData(), debounce)
		} else {
			loadData()
		}
	}

	onMount(() => {
		mounted = true
	})
	onDestroy(() => clearTimeout(debounceTimer))

	$: if (mounted) {
		searchQuery
		applyFilters(800)
	}
	$: if (mounted) {
		filterStatus
		applyFilters()
	}
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<h1 class="title"><i class="fa-light fa-repeat"></i> Subscriptions</h1>
		<p class="muted-color text-small">All subscriptions across the system</p>
	</div>

	<div class="filters">
		<div class="filter-field filter-search">
			<SearchInput placeholder="Search by customer..." bind:value={searchQuery} />
		</div>
		<div class="filter-field">
			<Select label="Status" bind:value={filterStatus} options={statusOptions} />
		</div>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if subscriptions.length === 0}
		<div class="section">
			<p class="muted-color">No subscriptions found.</p>
		</div>
	{:else}
		<div class="section table-wrapper">
			{#if filtering}
				<div class="table-overlay">
					<Spinner />
				</div>
			{/if}
			<AdvancedTable rows={subscriptions} pagination={10} scrollable="x" />
		</div>
	{/if}
</div>

<style lang="scss" scoped>
	.section .title {
		font-size: var(--font-size-large);
		font-weight: 600;

		i {
			margin-right: calc(var(--gutter) * 0.75);
			opacity: 0.6;
		}
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: calc(var(--gutter) * 2);
		background-color: var(--tertiary-color);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 3);
		margin-bottom: calc(var(--gutter) * 3);
	}

	.filter-search {
		flex: 1;
		min-width: 200px;
	}

	.filter-field {
		min-width: 140px;
	}

	.table-wrapper {
		position: relative;
	}

	.table-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		background-color: rgba(0, 0, 0, 0.25);
		border-radius: var(--border-radius);
	}
</style>
