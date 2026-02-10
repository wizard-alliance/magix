<script lang="ts">
	import { app } from "$lib/app"
	import { page } from "$app/stores"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import type { BillingSubscription } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import Badge from "$components/modules/badge.svelte"
	import Button from "$components/fields/button.svelte"

	let loading = true
	let cancelling = false
	let sub: BillingSubscription | null = null

	$: subId = Number($page.url.searchParams.get(`id`))

	onMount(async () => {
		try {
			const customer = await app.Commerce.Customer.get()
			sub = customer?.subscriptions?.find((s) => s.id === subId) ?? null
		} catch {
			app.UI.Notify.error(`Failed to load subscription`)
		}
		loading = false
	})

	const confirmCancel = async () => {
		if (!sub) return
		cancelling = true
		try {
			await app.Commerce.Subscriptions.cancel(sub.id)
			app.UI.Notify.success(`Subscription cancelled`)
			goto(`/account/subscriptions`)
		} catch (err) {
			app.UI.Notify.error(`Failed: ${app.Helpers.errMsg(err)}`)
			cancelling = false
		}
	}
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<h1 class="title"><i class="fa-light fa-xmark"></i> Cancel Subscription</h1>
		<p class="muted-color text-small">Review and confirm cancellation</p>
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
					<Badge text={sub.status} variant="success" />
				</div>
				<div class="detail-row">
					<span class="label">Period End</span>
					<span>{sub.currentPeriodEnd ?? `—`}</span>
				</div>
				<div class="detail-row">
					<span class="label">Created</span>
					<span>{sub.created ?? `—`}</span>
				</div>

				<div class="warning">
					<i class="fa-light fa-triangle-exclamation"></i>
					This will cancel your subscription at the end of the current billing period. You will retain access until
					<strong>{sub.currentPeriodEnd ?? `the end of your cycle`}</strong>.
				</div>

				<div class="actions-row">
					<Button href="/account/subscriptions/edit?id={sub.id}" variant="ghost" size="sm">
						<i class="fa-light fa-arrow-left"></i> Go Back
					</Button>
					<Button on:click={confirmCancel} loading={cancelling} disabled={cancelling} variant="danger" size="sm">
						<i class="fa-light fa-xmark"></i> Confirm Cancellation
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

	.warning {
		background-color: rgba(255, 107, 132, 0.08);
		border: 1px solid rgba(255, 107, 132, 0.2);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 2);
		font-size: var(--font-size-small);
		line-height: 1.5;
		color: var(--muted-color);

		i {
			color: var(--red);
			margin-right: calc(var(--gutter) * 0.5);
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
