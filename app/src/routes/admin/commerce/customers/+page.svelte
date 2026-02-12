<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount, onDestroy } from "svelte"
	import Spinner from "$components/modules/spinner.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"
	import SearchInput from "$components/fields/searchInput.svelte"
	import Button from "$components/fields/button.svelte"

	let loading = true
	let filtering = false
	let customers: any[] = []
	let mounted = false

	// Filter state
	let searchQuery = ``

	let debounceTimer: ReturnType<typeof setTimeout>

	const createTableData = (raw: any[]) =>
		raw.map((c) => ({
			ID: c.id,
			Name: c.billingName ?? `—`,
			Email: c.billingEmail ?? `—`,
			Product: c.productName ?? `—`,
			"Sub Status": c.subscriptionStatus ?? `—`,
			"User ID": c.userId ?? `—`,
			"VAT ID": c.vatId ?? `—`,
			Created: c.created ?? `—`,
		}))

	const loadData = async () => {
		filtering = true
		try {
			const query: Record<string, any> = {}
			if (searchQuery) query.search = searchQuery
			const data = await app.Commerce.Customer.list(query)
			customers = createTableData(data)
		} catch {
			app.UI.Notify.error(`Failed to load customers`)
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

	const resetFilters = () => {
		searchQuery = ``
	}

	$: activeFilters = searchQuery

	const handleAction = (e: CustomEvent<{ event: string; row: Record<string, any>; index: number }>) => {
		const { event, row } = e.detail
		if (event === `edit`) goto(`/admin/commerce/customers/${row.ID}`)
		if (event === `view`) app.UI.Notify.info(`Customer: ${row.Name || row.ID}`)
	}
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<h1 class="title"><i class="fa-light fa-users"></i> Customers</h1>
		<p class="muted-color text-small">All billing customers</p>
	</div>

	<div class="filters">
		<div class="filter-field filter-search">
			<SearchInput placeholder="Search by name or email..." bind:value={searchQuery} />
		</div>
		{#if activeFilters}
			<div class="filter-field filter-reset">
				<Button variant="secondary" on:click={resetFilters}>
					<i class="fa-light fa-xmark"></i>
					<span>Reset</span>
				</Button>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if customers.length === 0}
		<div class="section">
			<p class="muted-color">No customers found.</p>
		</div>
	{:else}
		<div class="section table-wrapper">
			{#if filtering}
				<div class="table-overlay">
					<Spinner />
				</div>
			{/if}
			<AdvancedTable
				rows={customers}
				pagination={10}
				scrollable="x"
				colActions={[
					{ name: `Edit`, icon: `fa-light fa-pen`, event: `edit` },
					{ name: `View`, icon: `fa-light fa-eye`, event: `view` },
				]}
				on:action={handleAction}
			/>
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

	.filter-reset {
		display: flex;
		align-items: flex-end;
		min-width: auto;
		padding-bottom: 2px;

		i {
			margin-right: calc(var(--gutter) * 0.5);
		}
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
