<script lang="ts">
	import { app } from "$lib/app"
	import { onMount, onDestroy } from "svelte"
	import type { BillingProductFull, BillingProductFeature } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import Button from "$components/fields/button.svelte"
	import Input from "$components/fields/input.svelte"
	import Select from "$components/fields/select.svelte"
	import Textarea from "$components/fields/textarea.svelte"
	import SearchInput from "$components/fields/searchInput.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"

	let loading = true
	let saving = false
	let filtering = false
	let allFeatures: BillingProductFeature[] = []
	let features: any[] = []
	let products: BillingProductFull[] = []
	let productOptions: { label: string; value: string }[] = []
	let mounted = false

	// Form state
	let editingId: number | null = null
	let featureName = ``
	let productId = ``
	let description = ``

	// Filter state
	let searchQuery = ``
	let filterProduct = ``

	let debounceTimer: ReturnType<typeof setTimeout>

	const productName = (id: number) => products.find((p) => p.id === id)?.name ?? `—`

	const createTableData = (raw: BillingProductFeature[]) =>
		raw.map((f) => ({
			ID: f.id,
			Feature: f.featureName,
			Product: productName(f.productId),
			Description: f.description ?? `—`,
			Created: f.created ?? `—`,
		}))

	const loadData = async () => {
		filtering = true
		try {
			products = await app.Commerce.Products.list()
			productOptions = products.map((p) => ({ label: p.name, value: String(p.id) }))
			const query: Record<string, any> = {}
			if (filterProduct) query.product_id = Number(filterProduct)
			allFeatures = await app.Commerce.Products.listFeatures(query)
			applyClientFilter()
		} catch {
			app.UI.Notify.error(`Failed to load features`)
		} finally {
			loading = false
			filtering = false
		}
	}

	const applyClientFilter = () => {
		let filtered = allFeatures
		if (searchQuery) {
			const q = searchQuery.toLowerCase()
			filtered = filtered.filter((f) =>
				f.featureName.toLowerCase().includes(q) ||
				(f.description ?? ``).toLowerCase().includes(q)
			)
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

	onMount(() => { mounted = true })
	onDestroy(() => clearTimeout(debounceTimer))

	$: if (mounted) { searchQuery; applyFilters(800) }
	$: if (mounted) { filterProduct; applyFilters() }

	const resetFilters = () => {
		searchQuery = ``
		filterProduct = ``
	}

	$: activeFilters = searchQuery || filterProduct

	const resetForm = () => {
		editingId = null
		featureName = ``
		productId = ``
		description = ``
	}

	const save = async () => {
		if (!featureName.trim() || !productId) {
			app.UI.Notify.error(`Feature name and product are required`)
			return
		}
		saving = true
		try {
			const body = { featureName: featureName.trim(), productId: Number(productId), description: description.trim() || undefined }
			if (editingId) {
				await app.Commerce.Products.updateFeature(editingId, body)
				app.UI.Notify.success(`Feature updated`)
			} else {
				await app.Commerce.Products.createFeature(body)
				app.UI.Notify.success(`Feature created`)
			}
			resetForm()
			await loadData()
		} catch (err) {
			app.UI.Notify.error(`Save failed: ${app.Helpers.errMsg(err)}`)
		}
		saving = false
	}

	const handleAction = async (e: CustomEvent<{ event: string; row: Record<string, any> }>) => {
		const { event, row } = e.detail
		if (event === `edit`) {
			const f = allFeatures.find((x) => x.id === row.ID)
			if (!f) return
			editingId = f.id
			featureName = f.featureName
			productId = String(f.productId)
			description = f.description ?? ``
		}
		if (event === `delete`) {
			const ok = await app.UI.Modal.confirm(`Delete feature`, `Are you sure you want to delete "${row.Feature}"?`)
			if (!ok) return
			try {
				await app.Commerce.Products.deleteFeature(row.ID)
				app.UI.Notify.success(`Feature deleted`)
				await loadData()
			} catch (err) {
				app.UI.Notify.error(`Delete failed: ${app.Helpers.errMsg(err)}`)
			}
		}
	}
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<h1 class="title"><i class="fa-light fa-stars"></i> Product Features</h1>
		<p class="muted-color text-small">Manage features attached to billing products</p>
	</div>

	<div class="section margin-bottom-4">
		<h3 class="form-heading">{editingId ? `Edit Feature` : `Add Feature`}</h3>
		<div class="row margin-bottom-2">
			<div class="col-xxs-12 col-md">
				<Input label="Feature name" bind:value={featureName} placeholder="e.g. Unlimited storage" />
			</div>
			<div class="col-xxs-12 col-md">
				<Select label="Product" bind:value={productId} options={productOptions} />
			</div>
		</div>
		<div class="row margin-bottom-2">
			<div class="col-xxs-12">
				<Textarea label="Description" bind:value={description} placeholder="Optional description" rows={2} />
			</div>
		</div>
		<div class="row">
			<div class="col-xxs-auto">
				<Button on:click={save} loading={saving} disabled={saving} size="sm">
					{editingId ? `Update` : `Add Feature`}
				</Button>
			</div>
			{#if editingId}
				<div class="col-xxs-auto">
					<Button on:click={resetForm} variant="ghost" size="sm">Cancel</Button>
				</div>
			{/if}
		</div>
	</div>

	<div class="filters">
		<div class="filter-field filter-search">
			<SearchInput placeholder="Search features..." bind:value={searchQuery} />
		</div>
		<div class="filter-field">
			<Select label="Product" bind:value={filterProduct} options={[{ label: `All Products`, value: `` }, ...productOptions]} />
		</div>
		{#if activeFilters}
			<div class="filter-field filter-reset">
				<Button variant="ghost" size="sm" on:click={resetFilters}>
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
	.form-heading {
		font-size: var(--font-size);
		font-weight: 600;
		margin-bottom: calc(var(--gutter) * 1.5);
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
