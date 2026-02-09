<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import type { BillingSubscription } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"

	let loading = true
	let subscriptions: any[] = []

	const createTableData = (raw: BillingSubscription[]) =>
		raw.map((s) => ({
			ID: s.id,
			Customer: s.customerId,
			Status: s.status,
			"Period Start": s.currentPeriodStart ?? `—`,
			"Period End": s.currentPeriodEnd ?? `—`,
			"Cancels at End": s.cancelAtPeriodEnd ? `Yes` : `No`,
			Created: s.created ?? `—`,
		}))

	onMount(async () => {
		try {
			const data = await app.Commerce.Subscriptions.list()
			subscriptions = createTableData(data)
		} catch {
			app.UI.Notify.error(`Failed to load subscriptions`)
		}
		loading = false
	})
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<h1 class="title"><i class="fa-light fa-repeat"></i> Subscriptions</h1>
		<p class="muted-color text-small">All subscriptions across the system</p>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if subscriptions.length === 0}
		<div class="section">
			<p class="muted-color">No subscriptions found.</p>
		</div>
	{:else}
		<div class="section">
			<AdvancedTable rows={subscriptions} pagination={10} scrollable="x" />
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
