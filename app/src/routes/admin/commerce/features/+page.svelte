<script lang="ts">
	import { app } from "$lib/app"
	import { onMount, onDestroy } from "svelte"
	import type { BillingProductFull, BillingProductFeature } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import Button from "$components/fields/button.svelte"
	import SearchInput from "$components/fields/searchInput.svelte"
	import Select from "$components/fields/select.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"
	import FeatureForm from "./FeatureForm.svelte"

	let loading = true
	let filtering = false
	let allFeatures: BillingProductFeature[] = []
	let features: any[] = []
	let products: BillingProductFull[] = []
	let productOptions: { label: string; value: string }[] = []
	let mounted = false

	// Filter state
	let searchQuery = ``
	let filterProduct = ``

	let debounceTimer: ReturnType<typeof setTimeout>

	const productName = (providerId: string) => {
		const p = products.find((p) => p.providerId === providerId)
		return p?.name ?? `—`
	}

	const createTableData = (raw: BillingProductFeature[]) =>
		raw.map((f) => ({
			ID: f.id,
			Feature: f.featureName,
			Product: productName(f.providerId),
			Order: f.sortOrder,
			Description: f.description ?? `—`,
			Created: f.created ?? `—`,
		}))

	const loadData = async () => {
		filtering = true
		try {
			products = await app.Commerce.Products.list()
			// Deduplicate to one entry per product group (by providerId) — features apply to the group
			const seen = new Map<string, string>()
			for (const p of products) {
				if (p.providerId && !seen.has(p.providerId)) seen.set(p.providerId, p.name)
			}
			productOptions = [...seen.entries()].map(([value, label]) => ({ label, value }))
			const query: Record<string, any> = {}
			if (filterProduct) query.provider_id = filterProduct
			allFeatures = await app.Commerce.Products.listFeatures(query)
			applyClientFilter()
		} catch {
			app.UI.Notify.error(`Failed to load features`, `Features`)
		} finally {
			loading = false
			filtering = false
		}
	}

	const applyClientFilter = () => {
		let filtered = allFeatures
		if (searchQuery) {
			const q = searchQuery.toLowerCase()
			filtered = filtered.filter((f) => f.featureName.toLowerCase().includes(q) || (f.description ?? ``).toLowerCase().includes(q))
		}
		features = createTableData(filtered)
	}

	const applyFilters = (debounce = 0) => {
		clearTimeout(debounceTimer)
		if (debounce > 0) {
			debounceTimer = setTimeout(() => {
				if (filterProduct) loadData()
				else applyClientFilter()
			}, debounce)
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
		filterProduct
		applyFilters()
	}

	const openForm = async (feature: BillingProductFeature | null = null) => {
		const result = await app.UI.Modal.form({
			title: feature ? `Edit Feature` : `Add Feature`,
			icon: `fa-stars`,
			component: FeatureForm,
			componentProps: {
				feature,
				productOptions,
			},
		})
		if (!result) return
		try {
			if (feature) {
				await app.Commerce.Products.updateFeature(feature.id, result)
				app.UI.Notify.success(`Feature updated`, `Saved`)
			} else {
				await app.Commerce.Products.createFeature(result)
				app.UI.Notify.success(`Feature created`, `Saved`)
			}
			await loadData()
		} catch (err) {
			app.UI.Notify.error(app.Helpers.errMsg(err), `Features`)
		}
	}

	const handleAction = async (e: CustomEvent<{ event: string; row: Record<string, any> }>) => {
		const { event, row } = e.detail
		if (event === `edit`) {
			const f = allFeatures.find((x) => x.id === row.ID)
			if (f) openForm(f)
		}
		if (event === `delete`) {
			const ok = await app.UI.Modal.confirm(`Delete feature`, `Are you sure you want to delete "${row.Feature}"?`)
			if (!ok) return
			try {
				await app.Commerce.Products.deleteFeature(row.ID)
				app.UI.Notify.success(`Feature deleted`, `Deleted`)
				await loadData()
			} catch (err) {
				app.UI.Notify.error(app.Helpers.errMsg(err), `Features`)
			}
		}
	}
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4 row middle-xxs between-xxs">
		<div class="col-xxs">
			<h1 class="title"><i class="fa-light fa-stars"></i> Product Features</h1>
			<p class="muted-color text-small">Manage features attached to billing products</p>
		</div>
		<div class="col-xxs-auto">
			<Button on:click={() => openForm()}>Add Feature</Button>
		</div>
	</div>

	<div class="filters">
		<div class="filter-field filter-search">
			<SearchInput placeholder="Search features..." bind:value={searchQuery} />
		</div>
		<div class="filter-field">
			<Select label="Product" bind:value={filterProduct} options={[{ label: `All Products`, value: `` }, ...productOptions]} />
		</div>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if features.length === 0}
		<div class="section">
			<p class="muted-color">No features found.</p>
		</div>
	{:else}
		<div class="section table-wrapper">
			{#if filtering}
				<div class="table-overlay">
					<Spinner />
				</div>
			{/if}
			<AdvancedTable
				rows={features}
				pagination={10}
				scrollable="x"
				onRowClick={(row) => {
					const f = allFeatures.find((x) => x.id === row.ID)
					if (f) openForm(f)
				}}
				colActions={[
					{ name: `Edit`, icon: `fa-light fa-pen`, event: `edit` },
					{ name: `Delete`, icon: `fa-light fa-trash`, event: `delete` },
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
