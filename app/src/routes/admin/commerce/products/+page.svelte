<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import type { BillingProductFull } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import Button from "$components/fields/button.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"

	let loading = true
	let syncing = false
	let products: any[] = []

	const createTableData = (raw: BillingProductFull[]) =>
		raw.map((p) => ({
			ID: p.id,
			Name: p.name,
			Type: p.type,
			Price: `${(p.price / 100).toFixed(2)} ${p.currency?.toUpperCase() ?? ``}`,
			Interval: p.interval ? `${p.intervalCount}x ${p.interval}` : `—`,
			Active: p.isActive ? `Yes` : `No`,
			Features: p.features?.length ?? 0,
			Created: p.created ?? `—`,
		}))

	const loadProducts = async () => {
		try {
			const data = await app.Commerce.Products.list()
			products = createTableData(data)
		} catch {
			app.UI.Notify.error(`Failed to load products`)
		}
	}

	const syncProducts = async () => {
		syncing = true
		try {
			await app.Commerce.Admin.LS.syncProducts()
			app.UI.Notify.success(`Products synced from LemonSqueezy`)
			await loadProducts()
		} catch (err) {
			app.UI.Notify.error(`Sync failed: ${(err as Error).message}`)
		}
		syncing = false
	}

	onMount(async () => {
		await loadProducts()
		loading = false
	})
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<div class="row middle-xs between-xs">
			<div class="col-xxs">
				<h1 class="title"><i class="fa-light fa-box"></i> Products</h1>
				<p class="muted-color text-small">Billing products synced from LemonSqueezy</p>
			</div>
			<div class="col-xxs-auto">
				<Button on:click={syncProducts} loading={syncing} disabled={syncing} variant="ghost" size="sm">
					<i class="fa-light fa-arrows-rotate"></i> Sync Products
				</Button>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if products.length === 0}
		<div class="section">
			<p class="muted-color">No products found. Try syncing from LemonSqueezy.</p>
		</div>
	{:else}
		<div class="section">
			<AdvancedTable rows={products} pagination={10} scrollable="x" />
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
</style>
