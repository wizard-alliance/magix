<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import type { BillingOrder } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"

	let loading = true
	let orders: any[] = []

	const createTableData = (raw: BillingOrder[]) =>
		raw.map((o) => ({
			ID: o.id,
			Type: o.type,
			Amount: app.Format.Currency.format(o.amount, o.currency),
			Status: o.status,
			"Payment Method": o.paymentMethod ?? `—`,
			"Paid At": o.paidAt ?? `—`,
			Created: o.created ?? `—`,
		}))

	onMount(async () => {
		try {
			const customer = await app.Commerce.Customer.get()
			if (customer?.orders) orders = createTableData(customer.orders)
		} catch {
			app.UI.Notify.error(`Failed to load orders`)
		}
		loading = false
	})
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<h1 class="title"><i class="fa-light fa-shopping-cart"></i> Orders</h1>
		<p class="muted-color text-small">Your order history</p>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if orders.length === 0}
		<div class="section">
			<p class="muted-color">No orders yet.</p>
		</div>
	{:else}
		<div class="section">
			<AdvancedTable rows={orders} pagination={10} scrollable="x" />
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
