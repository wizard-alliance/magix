<script lang="ts">
	import { app } from "$lib/app"
	import { page } from "$app/stores"
	import { onMount } from "svelte"
	import type { BillingInvoice, BillingOrder } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import Badge from "$components/modules/badge.svelte"
	import Button from "$components/fields/button.svelte"

	let loading = true
	let invoice: BillingInvoice | null = null
	let order: BillingOrder | null = null

	$: invoiceId = Number($page.params.id)

	const statusVariant = (status: string) => {
		if (status === `paid`) return `success`
		if (status === `pending` || status === `past_due`) return `warning`
		if (status === `failed`) return `danger`
		return `default`
	}

	const formatAddress = (snap: Record<string, any> | null) => {
		if (!snap || !Object.keys(snap).length) return null
		const parts = [
			snap.billing_name || snap.billingName,
			snap.billing_email || snap.billingEmail,
			snap.line1 || snap.billing_address_line1,
			snap.line2 || snap.billing_address_line2,
			[snap.city || snap.billing_city, snap.state || snap.billing_state, snap.zip || snap.billing_zip].filter(Boolean).join(`, `),
			snap.country || snap.billing_country,
		].filter(Boolean)
		return parts.length ? parts : null
	}

	onMount(async () => {
		try {
			const customer = await app.Commerce.Customer.get()
			invoice = customer?.invoices?.find((i) => i.id === invoiceId) ?? null
			if (invoice) order = customer?.orders?.find((o) => o.id === invoice!.orderId) ?? null
		} catch {
			app.UI.Notify.error(`Failed to load invoice`, `Invoice`)
		}
		loading = false
	})
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<div class="row middle-xs">
			<div class="col-xxs">
				<h1 class="title"><i class="fa-light fa-file-invoice"></i> Invoice #{invoiceId}</h1>
				<p class="muted-color text-small">Invoice details and download</p>
			</div>
			<div class="col-xxs-auto">
				<Button href="/account/invoices" variant="secondary">
					<i class="fa-light fa-arrow-left"></i> Back
				</Button>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if !invoice}
		<div class="section">
			<p class="muted-color">Invoice not found.</p>
		</div>
	{:else}
		{@const snap = invoice.billingOrderSnapshot}
		{@const custSnap = invoice.billingCustomersSnapshot}
		{@const addressLines = formatAddress(custSnap)}

		<div class="section">
			<div class="details">
				<div class="detail-row">
					<span class="label">Order ID</span>
					<span>{invoice.orderId}</span>
				</div>

				{#if snap}
					<div class="detail-row">
						<span class="label">Amount</span>
						<span>{app.Format.Currency.format(snap.amount, snap.currency)}</span>
					</div>
					<div class="detail-row">
						<span class="label">Status</span>
						<Badge text={snap.status} variant={statusVariant(snap.status)} />
					</div>
				{/if}

				{#if order?.type}
					<div class="detail-row">
						<span class="label">Type</span>
						<span class="capitalize">{order.type}</span>
					</div>
				{/if}

				<div class="detail-row">
					<span class="label">Date</span>
					<span>{invoice.created ?? `—`}</span>
				</div>

				{#if addressLines}
					<div class="detail-row address">
						<span class="label">Billing</span>
						<div class="address-block">
							{#each addressLines as line}
								<span>{line}</span>
							{/each}
						</div>
					</div>
				{/if}

				<div class="detail-row">
					<span class="label">Snapshot</span>
					<span class="muted-color text-small">v{invoice.snapshotVersion}</span>
				</div>

				<div class="actions-row">
					<Button on:click={() => app.Commerce.Invoices.downloadPdf(invoiceId).catch(() => app.UI.Notify.warning(`Invoice PDF not yet available`, `Invoice`))} variant="primary">
						<i class="fa-light fa-download"></i> Download Invoice
					</Button>
				</div>
			</div>
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

	.capitalize {
		text-transform: capitalize;
	}

	.details {
		background-color: rgba(255, 255, 255, 0.04);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 2.5);
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 1.5);
	}

	.detail-row {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 2);

		&.address {
			align-items: flex-start;
		}

		.label {
			min-width: 160px;
			font-size: var(--font-size-small);
			color: var(--muted-color);
		}
	}

	.address-block {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.actions-row {
		display: flex;
		flex-wrap: wrap;
		gap: calc(var(--gutter) * 1);
		margin-top: calc(var(--gutter) * 1);
		padding-top: calc(var(--gutter) * 1.5);
		border-top: var(--border);
	}
</style>
