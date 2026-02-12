<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import type { BillingProductFull, BillingProductFeature } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import Button from "$components/fields/button.svelte"
	import Input from "$components/fields/input.svelte"
	import Select from "$components/fields/select.svelte"
	import Textarea from "$components/fields/textarea.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"

	let loading = true
	let saving = false
	let features: any[] = []
	let products: BillingProductFull[] = []
	let productOptions: { label: string; value: string }[] = []

	// Form state
	let editingId: number | null = null
	let featureName = ``
	let productId = ``
	let description = ``

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
		try {
			products = await app.Commerce.Products.list()
			productOptions = products.map((p) => ({ label: p.name, value: String(p.id) }))
			const raw = await app.Commerce.Products.listFeatures()
			features = createTableData(raw)
		} catch {
			app.UI.Notify.error(`Failed to load features`)
		}
	}

	onMount(async () => {
		await loadData()
		loading = false
	})

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
			const raw = await app.Commerce.Products.listFeatures()
			const f = raw.find((x) => x.id === row.ID)
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

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if features.length === 0}
		<div class="section">
			<p class="muted-color">No features yet. Add one above.</p>
		</div>
	{:else}
		<div class="section">
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
</style>
