<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import type { BillingCustomer } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"

	let loading = true
	let customers: any[] = []

	const createTableData = (raw: BillingCustomer[]) =>
		raw.map((c) => ({
			ID: c.id,
			"User ID": c.userId ?? `—`,
			"Company ID": c.companyId ?? `—`,
			Name: c.billingName ?? `—`,
			Email: c.billingEmail ?? `—`,
			"VAT ID": c.vatId ?? `—`,
			Created: c.created ?? `—`,
		}))

	onMount(async () => {
		try {
			const data = await app.Commerce.Customer.list()
			customers = createTableData(data)
		} catch {
			app.UI.Notify.error(`Failed to load customers`)
		}
		loading = false
	})

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

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if customers.length === 0}
		<div class="section">
			<p class="muted-color">No customers found.</p>
		</div>
	{:else}
		<div class="section">
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
</style>
