<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import type { BillingSubscription } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import Button from "$components/fields/button.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"

	let loading = true
	let subscriptions: any[] = []

	const createTableData = (raw: BillingSubscription[]) =>
		raw.map((s) => ({
			ID: s.id,
			Status: s.status,
			"Period Start": s.currentPeriodStart ?? `—`,
			"Period End": s.currentPeriodEnd ?? `—`,
			"Cancels at End": s.cancelAtPeriodEnd ? `Yes` : `No`,
			Created: s.created ?? `—`,
		}))

	onMount(async () => {
		try {
			const customer = await app.Commerce.Customer.get()
			if (customer?.subscriptions) subscriptions = createTableData(customer.subscriptions)
		} catch {
			app.UI.Notify.error(`Failed to load subscriptions`)
		}
		loading = false
	})

	const handleAction = (e: CustomEvent<{ event: string; row: Record<string, any>; index: number }>) => {
		const { event, row } = e.detail
		if (event === `manage`) goto(`/account/subscriptions/edit?id=${row.ID}`)
	}
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<div class="row middle-xs">
			<div class="col-xxs">
				<h1 class="title"><i class="fa-light fa-repeat"></i> Subscriptions</h1>
				<p class="muted-color text-small">Manage your active subscriptions</p>
			</div>
			<div class="col-xxs-auto">
				<Button href="/account/subscriptions/new" variant="ghost" size="sm">
					<i class="fa-light fa-plus"></i> New Subscription
				</Button>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if subscriptions.length === 0}
		<div class="section">
			<p class="muted-color">No subscriptions yet.</p>
		</div>
	{:else}
		<div class="section">
			<AdvancedTable
				rows={subscriptions}
				pagination={10}
				scrollable="x"
				colActions={[{ name: `Manage`, icon: `fa-light fa-pen-to-square`, event: `manage` }]}
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
