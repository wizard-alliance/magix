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

	const showTypes = new Set([`subscription`, `lead_magnet`])

	onMount(async () => {
		try {
			const all = await app.Commerce.Products.list()
			products = all.filter((p) => showTypes.has(p.type) && p.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
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
			app.UI.Notify.error(`Checkout failed: ${app.Helpers.errMsg(err)}`)
		}
		subscribing = null
	}

	const isFree = (product: BillingProductFull) => product.type === `lead_magnet` || product.price === 0

	const ctaLabel = (product: BillingProductFull) => {
		if (isFree(product)) return `Get Free Access`
		if (product.trialDays > 0) return `Start a free ${product.trialDays}-day trial`
		return `Get Started`
	}

	const formatPrice = (price: number) => {
		const str = price.toFixed(2)
		const [whole, dec] = str.split(`.`)
		return { whole, dec }
	}

	const boldFirstWord = (text: string) => {
		const i = text.indexOf(` `)
		if (i === -1) return `<strong>${text}</strong>`
		return `<strong>${text.slice(0, i)}</strong>${text.slice(i)}`
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
				<Button href="/account/subscriptions" variant="secondary">
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
			{#each products as product, idx (product.id)}
				{@const popular = idx === 1 && products.length > 1}
				<div class="plan-card" class:popular>
					{#if popular}
						<div class="popular-badge"><Badge text="POPULAR" variant="success" /></div>
					{/if}

					<h2 class="plan-name">{product.name}</h2>
					{#if product.description}
						<p class="plan-description">{product.description}</p>
					{/if}

					<div class="plan-divider"></div>

					<div class="plan-price">
						{#if isFree(product)}
							<span class="amount">Free</span>
						{:else}
							<span class="currency">{product.currency?.toUpperCase() ?? `USD`}</span>
							<span class="amount">${formatPrice(product.price).whole}<span class="dec">.{formatPrice(product.price).dec}</span></span>
						{/if}
					</div>
					{#if !isFree(product) && product.interval}
						<p class="plan-interval">billed {product.interval}ly</p>
					{/if}

					<div class="plan-action">
						<Button
							on:click={() => subscribe(product)}
							loading={subscribing === product.id}
							disabled={subscribing !== null}
							variant={popular ? `primary` : `ghost`}
							size="sm">{ctaLabel(product)}</Button
						>
					</div>

					{#if product.features?.length}
						<div class="plan-features-section">
							<p class="features-heading">{product.name} features:</p>
							<ul class="plan-features">
								{#each product.features as feature}
									<li><i class="fa-solid fa-check"></i> <span>{@html boldFirstWord(feature.featureName)}</span></li>
								{/each}
							</ul>
						</div>
					{/if}
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
		position: relative;
		background-color: rgba(255, 255, 255, 0.04);
		border: 1px solid transparent;
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 3);
		display: flex;
		flex-direction: column;

		&.popular {
			border-color: var(--accent-color);
		}
	}

	.popular-badge {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.plan-name {
		font-size: var(--font-size-large);
		font-weight: 700;
		margin-bottom: calc(var(--gutter) * 0.5);
	}

	.plan-description {
		font-size: var(--font-size-small);
		color: var(--muted-color);
		line-height: 1.5;
		margin-bottom: calc(var(--gutter) * 1.5);
	}

	.plan-divider {
		width: 32px;
		height: 2px;
		background: var(--accent-color);
		border-radius: 2px;
		margin-bottom: calc(var(--gutter) * 2);
	}

	.plan-price {
		display: flex;
		align-items: baseline;
		gap: calc(var(--gutter) * 0.75);

		.currency {
			font-size: var(--font-size-small);
			opacity: 0.5;
		}

		.amount {
			font-size: 2.2rem;
			font-weight: 700;

			.dec {
				font-size: 1.2rem;
			}
		}
	}

	.plan-interval {
		font-size: var(--font-size-small);
		color: var(--muted-color);
		margin-top: calc(var(--gutter) * 0.25);
		margin-bottom: calc(var(--gutter) * 2);
	}

	.plan-action {
		margin-bottom: calc(var(--gutter) * 3);

		:global(button),
		:global(a) {
			width: 100%;
		}
	}

	.plan-features-section {
		margin-top: auto;

		.features-heading {
			font-size: var(--font-size-small);
			font-weight: 600;
			margin-bottom: calc(var(--gutter) * 1.5);
		}
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
				font-size: 0.7rem;
			}
		}
	}
</style>
