<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import type { BillingInvoice } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"

	let loading = true
	let invoices: any[] = []

	const createTableData = (raw: BillingInvoice[]) =>
		raw.map((inv) => ({
			ID: inv.id,
			"Order ID": inv.orderId,
			Customer: inv.customerId,
			PDF: inv.pdfUrl ? `Download` : `—`,
			Created: inv.created ?? `—`,
		}))

	onMount(async () => {
		try {
			const data = await app.Commerce.Invoices.list()
			invoices = createTableData(data)
		} catch {
			app.UI.Notify.error(`Failed to load invoices`)
		}
		loading = false
	})
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<h1 class="title"><i class="fa-light fa-file-invoice"></i> Invoices</h1>
		<p class="muted-color text-small">All invoices across the system</p>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if invoices.length === 0}
		<div class="section">
			<p class="muted-color">No invoices found.</p>
		</div>
	{:else}
		<div class="section">
			<AdvancedTable rows={invoices} pagination={10} scrollable="x" />
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
