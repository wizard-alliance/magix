<script lang="ts">
	import { app } from "$lib/app"
	import { page } from "$app/stores"
	import { onMount } from "svelte"
	import type { BillingSubscription, BillingProductFull } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import Badge from "$components/modules/badge.svelte"
	import Button from "$components/fields/button.svelte"

	let loading = true
	let acting = false
	let sub: BillingSubscription | null = null
	let plan: BillingProductFull | null = null

	$: subId = Number($page.url.searchParams.get(`id`))

	const statusVariant = (status: string) => {
		if (status === `active`) return `success`
		if (status === `paused` || status === `past_due`) return `warning`
		return `danger`
	}

	const loadData = async () => {
		loading = true
		try {
			const customer = await app.Commerce.Customer.get()
			sub = customer?.subscriptions?.find((s) => s.id === subId) ?? null
			if (sub?.planId) plan = await app.Commerce.Products.get(sub.planId)
		} catch {
			app.UI.Notify.error(`Failed to load subscription`)
		}
		loading = false
	}

	const pause = async () => {
		if (!sub) return
		acting = true
		try {
			await app.Commerce.Subscriptions.pause(sub.id)
			app.UI.Notify.success(`Subscription paused`)
			await loadData()
		} catch (err) {
			app.UI.Notify.error(`Failed: ${app.Helpers.errMsg(err)}`)
		}
		acting = false
	}

	const resume = async () => {
		if (!sub) return
		acting = true
		try {
			await app.Commerce.Subscriptions.resume(sub.id)
			app.UI.Notify.success(`Subscription resumed`)
			await loadData()
		} catch (err) {
			app.UI.Notify.error(`Failed: ${app.Helpers.errMsg(err)}`)
		}
		acting = false
	}

	onMount(loadData)
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<div class="row middle-xs">
			<div class="col-xxs">
				<h1 class="title"><i class="fa-light fa-pen-to-square"></i> Manage Subscription</h1>
				<p class="muted-color text-small">View details and manage your subscription</p>
			</div>
			<div class="col-xxs-auto">
				<Button href="/account/subscriptions" variant="ghost" size="sm">
					<i class="fa-light fa-arrow-left"></i> Back
				</Button>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if !sub}
		<div class="section">
			<p class="muted-color">Subscription not found.</p>
		</div>
	{:else}
		<div class="section">
			<div class="details">
				<div class="detail-row">
					<span class="label">Status</span>
					<Badge text={sub.status} variant={statusVariant(sub.status)} />
				</div>
				{#if plan}
					<div class="detail-row">
						<span class="label">Plan</span>
						<span>{plan.name}</span>
					</div>
				{/if}
				<div class="detail-row">
					<span class="label">Period Start</span>
					<span>{sub.currentPeriodStart ?? `—`}</span>
				</div>
				<div class="detail-row">
					<span class="label">Period End</span>
					<span>{sub.currentPeriodEnd ?? `—`}</span>
				</div>
				{#if sub.cancelAtPeriodEnd}
					<div class="detail-row">
						<span class="label">Cancels at period end</span>
						<Badge text="Yes" variant="warning" />
					</div>
				{/if}
				{#if sub.canceledAt}
					<div class="detail-row">
						<span class="label">Cancelled</span>
						<span>{sub.canceledAt}</span>
					</div>
				{/if}
				{#if sub.pausedAt}
					<div class="detail-row">
						<span class="label">Paused</span>
						<span>{sub.pausedAt}</span>
					</div>
				{/if}
				<div class="detail-row">
					<span class="label">Created</span>
					<span>{sub.created ?? `—`}</span>
				</div>

				<div class="actions-row">
					{#if sub.status === `active` && !sub.pausedAt}
						<Button on:click={pause} loading={acting} disabled={acting} variant="ghost" size="sm">
							<i class="fa-light fa-pause"></i> Pause
						</Button>
					{/if}
					{#if sub.pausedAt}
						<Button on:click={resume} loading={acting} disabled={acting} variant="ghost" size="sm">
							<i class="fa-light fa-play"></i> Resume
						</Button>
					{/if}
					{#if !sub.canceledAt}
						<Button href="/account/subscriptions/cancel?id={sub.id}" variant="danger" size="sm">
							<i class="fa-light fa-xmark"></i> Cancel Subscription
						</Button>
					{/if}
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

		.label {
			min-width: 160px;
			font-size: var(--font-size-small);
			color: var(--muted-color);
		}
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
