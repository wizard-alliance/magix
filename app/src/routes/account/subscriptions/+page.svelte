<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import type { BillingSubscription } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import Button from "$components/fields/button.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"

	let loading = true
	let activeSubs: any[] = []
	let historySubs: any[] = []

	const activeStatuses = new Set([`active`, `paused`, `past_due`])

	const createTableData = (raw: (BillingSubscription & { planName?: string })[]) =>
		raw.map((s) => ({
			ID: s.id,
			Plan: s.planName ?? `—`,
			Status: s.status,
			"Period Start": s.currentPeriodStart ?? `—`,
			"Period End": s.currentPeriodEnd ?? `—`,
			"Cancels at End": s.cancelAtPeriodEnd ? `Yes` : `No`,
			Created: s.created ?? `—`,
		}))

	onMount(async () => {
		try {
			const customer = await app.Commerce.Customer.get()
			if (customer?.subscriptions) {
				// Resolve plan names in parallel
				const planIds = [...new Set(customer.subscriptions.map((s) => s.planId).filter((id): id is number => typeof id === `number` && id > 0))]
				const planMap = new Map<number, string>()
				await Promise.all(
					planIds.map(async (id) => {
						try {
							const product = await app.Commerce.Products.get(id)
							if (product) planMap.set(id, product.name)
						} catch {
							/* skip */
						}
					}),
				)

				const enriched = customer.subscriptions.map((s) => ({
					...s,
					planName: s.planId ? (planMap.get(s.planId) ?? `—`) : `—`,
				}))

				const active = enriched.filter((s) => activeStatuses.has(s.status))
				const history = enriched.filter((s) => !activeStatuses.has(s.status))

				activeSubs = createTableData(active)
				historySubs = createTableData(history)
			}
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
	{:else}
		<div class="section margin-bottom-4">
			<h2 class="subtitle"><i class="fa-light fa-circle-check"></i> Active Subscriptions</h2>
			{#if activeSubs.length === 0}
				<p class="muted-color">No active subscriptions.</p>
			{:else}
				<AdvancedTable
					rows={activeSubs}
					pagination={10}
					scrollable="x"
					colActions={[{ name: `Manage`, icon: `fa-light fa-pen-to-square`, event: `manage` }]}
					on:action={handleAction}
				/>
			{/if}
		</div>

		<div class="section">
			<h2 class="subtitle"><i class="fa-light fa-clock-rotate-left"></i> Subscription History</h2>
			{#if historySubs.length === 0}
				<p class="muted-color">No subscription history.</p>
			{:else}
				<AdvancedTable rows={historySubs} pagination={10} scrollable="x" />
			{/if}
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

	.subtitle {
		font-size: var(--font-size);
		font-weight: 600;
		margin-bottom: calc(var(--gutter) * 2);

		i {
			margin-right: calc(var(--gutter) * 0.5);
			opacity: 0.6;
		}
	}
</style>
