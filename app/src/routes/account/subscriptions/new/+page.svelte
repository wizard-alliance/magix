<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import type { BillingProductFull } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import Badge from "$components/modules/badge.svelte"
	import Button from "$components/fields/button.svelte"

	let loading = true
	let products: BillingProductFull[] = []
	let subscribing: number | null = null

	onMount(async () => {
		try {
			const all = await app.Commerce.Products.list()
			products = all.filter((p) => p.type === `subscription` && p.isActive && p.providerVariantId).sort((a, b) => a.sortOrder - b.sortOrder)
		} catch {
			app.UI.Notify.error(`Failed to load plans`)
		}
		loading = false
	})

	const subscribe = async (product: BillingProductFull) => {
		subscribing = product.id
		try {
			const res = await app.Commerce.Checkout.create({
				variantId: product.providerVariantId!,
				planId: product.id,
				redirectUrl: `${window.location.origin}/account/subscriptions`,
			})
			if (res?.url) window.location.href = res.url
			else app.UI.Notify.error(`Checkout unavailable`)
		} catch (err) {
			app.UI.Notify.error(`Checkout failed: ${(err as Error).message}`)
		}
		subscribing = null
	}

	const formatInterval = (interval: string, count: number) => {
		if (count === 1) return interval
		return `${count} ${interval}s`
	}
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<div class="row middle-xs">
			<div class="col-xxs">
				<h1 class="title"><i class="fa-light fa-plus"></i> New Subscription</h1>
				<p class="muted-color text-small">Choose a plan to get started</p>
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
	{:else if products.length === 0}
		<div class="section">
			<p class="muted-color">No plans available at this time.</p>
		</div>
	{:else}
		<div class="plans-grid">
			{#each products as product (product.id)}
				<div class="plan-card">
					<h2 class="plan-name">{product.name}</h2>
					<div class="plan-price">
						<span class="amount">{app.Format.Currency.format(product.price, product.currency)}</span>
						{#if product.interval}
							<span class="interval">/ {formatInterval(product.interval, product.intervalCount)}</span>
						{/if}
					</div>
					{#if product.trialDays > 0}
						<Badge text="{product.trialDays}-day free trial" variant="success" />
					{/if}
					{#if product.description}
						<p class="plan-description">{product.description}</p>
					{/if}
					{#if product.features?.length}
						<ul class="plan-features">
							{#each product.features as feature}
								<li><i class="fa-light fa-check"></i> {feature.featureName}</li>
							{/each}
						</ul>
					{/if}
					<div class="plan-action">
						<Button on:click={() => subscribe(product)} loading={subscribing === product.id} disabled={subscribing !== null} size="sm">Subscribe</Button>
					</div>
				</div>
			{/each}
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

	.plans-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: calc(var(--gutter) * 3);
	}

	.plan-card {
		background-color: rgba(255, 255, 255, 0.04);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 3);
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 1.5);
	}

	.plan-name {
		font-size: var(--font-size-large);
		font-weight: 600;
	}

	.plan-price {
		display: flex;
		align-items: baseline;
		gap: calc(var(--gutter) * 0.5);

		.amount {
			font-size: 1.8rem;
			font-weight: 700;
		}

		.currency {
			font-size: var(--font-size-small);
			opacity: 0.6;
		}

		.interval {
			font-size: var(--font-size-small);
			opacity: 0.5;
		}
	}

	.plan-description {
		font-size: var(--font-size-small);
		color: var(--muted-color);
		line-height: 1.5;
	}

	.plan-features {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 0.75);
		font-size: var(--font-size-small);

		li {
			display: flex;
			align-items: center;
			gap: calc(var(--gutter) * 0.75);

			i {
				color: var(--accent-color);
				font-size: 0.75rem;
			}
		}
	}

	.plan-action {
		margin-top: auto;
		padding-top: calc(var(--gutter) * 1);
	}
</style>
