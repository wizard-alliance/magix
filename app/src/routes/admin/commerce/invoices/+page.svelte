<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import type { BillingInvoice } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"

	let loading = true
	let invoices: any[] = []
	let rawInvoices: BillingInvoice[] = []

	const statusLabel = (s: string) => (s === `paid` ? `Paid` : s === `pending` ? `Pending` : s === `refunded` ? `Refunded` : s === `failed` ? `Failed` : (s ?? `—`))

	const createTableData = (raw: BillingInvoice[]) =>
		raw.map((inv) => {
			const snap = inv.billingOrderSnapshot
			return {
				ID: inv.id,
				"Order ID": inv.orderId,
				Customer: inv.customerName || inv.customerEmail || `#${inv.customerId}`,
				Amount: snap ? app.Format.Currency.format(snap.amount, snap.currency) : `—`,
				Status: snap?.status ? statusLabel(snap.status) : `—`,
				PDF: inv.pdfUrl ?? `—`,
				Created: inv.created ?? `—`,
			}
		})

	const actions = [
		{ name: `Download Invoice`, icon: `fa-light fa-download`, event: `download` },
		{ name: `Regenerate Invoice`, icon: `fa-light fa-rotate`, event: `regenerate` },
	]

	const onAction = async (e: CustomEvent<{ event: string; row: Record<string, any>; index: number }>) => {
		const { event, row } = e.detail
		const inv = rawInvoices.find((i) => i.id === row.ID)
		if (!inv) return

		if (event === `download`) {
			app.Commerce.Invoices.downloadPdf(inv.id).catch(() => {
				app.UI.Notify.warning(`Invoice PDF not yet available from payment provider`, `Invoice`)
			})
		} else if (event === `regenerate`) {
			try {
				await app.Commerce.Invoices.regeneratePdf(inv.id)
				app.UI.Notify.success(`Invoice #${inv.id} regenerated`, `Invoice`)
			} catch {
				app.UI.Notify.error(`Failed to regenerate invoice`, `Invoice`)
			}
		}
	}

	onMount(async () => {
		try {
			const data = await app.Commerce.Invoices.list()
			rawInvoices = data
			invoices = createTableData(data)
		} catch {
			app.UI.Notify.error(`Failed to load invoices`, `Invoices`)
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
			<AdvancedTable rows={invoices} pagination={10} scrollable="x" colActions={actions} on:action={onAction} />
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
