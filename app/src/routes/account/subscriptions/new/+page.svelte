<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import type { BillingProductGroup, BillingProduct } from "$lib/types/commerce"
	import type { BillingSubscription } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import Badge from "$components/modules/badge.svelte"
	import Tooltip from "$components/modules/tooltip.svelte"
	import Button from "$components/fields/button.svelte"

	let loading = true
	let groups: BillingProductGroup[] = []
	let subscribing: string | null = null
	let activeSub: BillingSubscription | null = null
	let activePlanId: number | null = null

	// Collect all unique intervals from loaded groups
	let intervals: string[] = []
	let selectedInterval = ``

	const intervalLabels: Record<string, string> = {}

	const formatInterval = (interval: string, intervalCount: number) => {
		if (interval === `month` && intervalCount === 1) return `Monthly`
		if (interval === `month` && intervalCount === 3) return `Quarterly`
		if (interval === `year` && intervalCount === 1) return `Yearly`
		return `Every ${intervalCount} ${interval}${intervalCount > 1 ? `s` : ``}`
	}

	const intervalKey = (v: BillingProduct) => `${v.interval}_${v.intervalCount}`

	onMount(async () => {
		try {
			const [grouped, customer] = await Promise.all([app.Commerce.Products.listGrouped(), app.Commerce.Customer.get()])
			groups = grouped

			if (customer?.subscriptions) {
				const activeStatuses = new Set([`active`, `paused`, `past_due`])
				activeSub = customer.subscriptions.find((s) => activeStatuses.has(s.status)) ?? null
				activePlanId = activeSub?.planId ?? null
			}

			// Build interval list from all variants across groups
			const seen = new Map<string, string>()
			for (const group of groups) {
				for (const v of group.variants) {
					const key = intervalKey(v)
					if (!seen.has(key)) {
						const label = v.variationName || formatInterval(v.interval, v.intervalCount)
						seen.set(key, label)
						intervalLabels[key] = label
					}
				}
			}
			intervals = [...seen.keys()]
			// Default to the first interval (usually monthly)
			if (intervals.length) selectedInterval = intervals[0]
		} catch {
			app.UI.Notify.error(`Failed to load plans`, `Plans`)
		}
		loading = false
	})

	const getVariant = (group: BillingProductGroup): BillingProduct | null => group.variants.find((v) => intervalKey(v) === selectedInterval) ?? null

	const isCurrentPlan = (variant: BillingProduct) => activePlanId === variant.id

	const isUpgrade = (group: BillingProductGroup) => {
		if (!activeSub || !activePlanId) return false
		// Find which group the current plan belongs to
		for (const g of groups) {
			if (g.variants.some((v) => v.id === activePlanId)) {
				return group.sortOrder > g.sortOrder
			}
		}
		return false
	}

	const isDowngrade = (group: BillingProductGroup) => {
		if (!activeSub || !activePlanId) return false
		for (const g of groups) {
			if (g.variants.some((v) => v.id === activePlanId)) {
				return group.sortOrder < g.sortOrder
			}
		}
		return false
	}

	const subscribe = async (variant: BillingProduct) => {
		if (!variant.providerVariantId) {
			app.UI.Notify.warning(`This plan is not available for checkout yet`, `Checkout`)
			return
		}
		subscribing = variant.providerVariantId
		try {
			// If user has an active sub, this is a plan change
			if (activeSub) {
				await app.Commerce.Subscriptions.changePlan(activeSub.id, variant.providerVariantId)
				app.UI.Notify.success(`Plan change initiated — it may take a moment to update`, `Plan Change`)
				// Refresh data
				const customer = await app.Commerce.Customer.get()
				activeSub = customer?.subscriptions?.find((s) => [`active`, `paused`, `past_due`].includes(s.status)) ?? null
				activePlanId = activeSub?.planId ?? null
			} else {
				// New checkout
				const res = await app.Commerce.Checkout.create({
					variantId: variant.providerVariantId,
					planId: variant.id,
					redirectUrl: `${window.location.origin}/account/subscriptions`,
				})
				if (res?.url) app.Commerce.LemonSqueezy.open(res.url)
				else app.UI.Notify.error(`No checkout URL returned`, `Checkout`)
			}
		} catch (err: any) {
			const status = err?.status ?? err?.response?.status
			if (status === 409) app.UI.Notify.warning(`You already have an active subscription`, `Checkout`)
			else app.UI.Notify.error(app.Helpers.errMsg(err), `Checkout`)
		}
		subscribing = null
	}

	const ctaLabel = (variant: BillingProduct, group: BillingProductGroup) => {
		if (isCurrentPlan(variant)) return `Current Plan`
		if (activeSub) {
			if (isUpgrade(group)) return `Upgrade`
			if (isDowngrade(group)) return `Downgrade`
			return `Switch Plan`
		}
		if (variant.trialDays > 0) return `Start ${variant.trialDays}-day free trial`
		return `Get Started`
	}

	const ctaVariant = (variant: BillingProduct, group: BillingProductGroup, idx: number) => {
		if (isCurrentPlan(variant)) return `secondary`
		if (activeSub && isUpgrade(group)) return `primary`
		if (idx === 1 && groups.length > 1) return `primary`
		return `secondary`
	}

	const formatPrice = (cents: number) => {
		const dollars = cents / 100
		const str = dollars.toFixed(2)
		const [whole, dec] = str.split(`.`)
		return { whole, dec }
	}

	// Calculate discount % vs monthly equivalent
	const getDiscount = (group: BillingProductGroup, variant: BillingProduct): number | null => {
		const monthly = group.variants.find((v) => v.interval === `month` && v.intervalCount === 1)
		if (!monthly || variant === monthly) return null

		// Normalise both to a monthly cost
		let months = 0
		if (variant.interval === `month`) months = variant.intervalCount
		else if (variant.interval === `year`) months = variant.intervalCount * 12
		if (months <= 1) return null

		const monthlyEquivalent = monthly.price * months
		if (variant.price >= monthlyEquivalent) return null
		return Math.round(((monthlyEquivalent - variant.price) / monthlyEquivalent) * 100)
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
				<h1 class="title"><i class="fa-light fa-plus"></i> {activeSub ? `Change Plan` : `New Subscription`}</h1>
				<p class="muted-color text-small">{activeSub ? `Upgrade, downgrade, or switch billing interval` : `Choose a plan to get started`}</p>
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
	{:else if groups.length === 0}
		<div class="section">
			<p class="muted-color">No plans available at this time.</p>
		</div>
	{:else}
		{#if intervals.length > 1}
			<div class="interval-toggle section margin-bottom-4">
				{#each intervals as key}
					<button class="interval-btn" class:active={selectedInterval === key} on:click={() => (selectedInterval = key)}>{intervalLabels[key]}</button>
				{/each}
			</div>
		{/if}

		<div class="plans-grid">
			{#each groups as group, idx (group.providerId)}
				{@const variant = getVariant(group)}
				{@const current = variant !== null && isCurrentPlan(variant)}
				{@const popular = variant !== null && idx === 1 && groups.length > 1 && !activeSub}
				<div class="plan-card" class:popular class:current class:unavailable={!variant}>
					{#if current}
						<div class="popular-badge"><Badge text="CURRENT PLAN" variant="default" /></div>
					{:else if popular}
						<div class="popular-badge"><Badge text="POPULAR" variant="success" /></div>
					{:else if variant && activeSub && isUpgrade(group)}
						<div class="popular-badge"><Badge text="UPGRADE" variant="success" /></div>
					{/if}

					<h2 class="plan-name">{group.name}</h2>
					{#if group.description}
						<p class="plan-description">{@html group.description}</p>
					{/if}

					<div class="plan-divider"></div>

					{#if variant}
						{@const discount = getDiscount(group, variant)}
						<div class="plan-price">
							<span class="currency">{variant.currency?.toUpperCase() ?? `USD`}</span>
							<span class="amount">${formatPrice(variant.price).whole}<span class="dec">.{formatPrice(variant.price).dec}</span></span>
						</div>
						<p class="plan-interval">
							{variant.variationName || intervalLabels[intervalKey(variant)]}
							{#if discount}
								<span class="discount-badge">Save {discount}%</span>
							{/if}
						</p>

						<div class="plan-action">
							<Button
								on:click={() => subscribe(variant)}
								loading={subscribing === variant.providerVariantId}
								disabled={subscribing !== null || current}
								variant={ctaVariant(variant, group, idx)}
								size="md">{ctaLabel(variant, group)}</Button
							>
						</div>
					{:else}
						<div class="unavailable-msg">
							<i class="fa-light fa-circle-info"></i>
							<p>Not available as {intervalLabels[selectedInterval]}</p>
						</div>
					{/if}

					{#if group.features?.length}
						<div class="plan-features-section">
							<p class="features-heading">{group.name} features:</p>
							<ul class="plan-features">
								{#each group.features as feature}
									<li>
										<i class="fa-solid fa-check"></i>
										{#if feature.description}
											<Tooltip text={feature.description} position="top">
												<span class="has-tooltip">{@html boldFirstWord(feature.featureName)}</span>
											</Tooltip>
										{:else}
											<span>{@html boldFirstWord(feature.featureName)}</span>
										{/if}
									</li>
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

	.interval-toggle {
		display: flex;
		justify-content: center;
		gap: 0;
		background-color: rgba(255, 255, 255, 0.04);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 0.4);
		width: fit-content;
		margin: 0 auto calc(var(--gutter) * 3);
	}

	.interval-btn {
		padding: calc(var(--gutter) * 0.6) calc(var(--gutter) * 2);
		border: none;
		background: transparent;
		color: var(--muted-color);
		font-size: var(--font-size-small);
		font-weight: 500;
		border-radius: calc(var(--border-radius) - 2px);
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover {
			color: var(--text-color);
		}

		&.active {
			background-color: var(--accent-color);
			color: var(--text-color);
		}
	}

	.plans-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
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

		&.current {
			border-color: var(--info-color);
			opacity: 0.75;
		}

		&.unavailable {
			opacity: 0.4;
			pointer-events: none;
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
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 0.75);
	}

	.discount-badge {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--accent-color);
		background: rgba(var(--accent-color-rgb, 116, 231, 168), 0.12);
		padding: 2px 6px;
		border-radius: calc(var(--border-radius) - 2px);
	}

	.unavailable-msg {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: calc(var(--gutter) * 1);
		padding: calc(var(--gutter) * 3) 0;
		margin-bottom: calc(var(--gutter) * 2);
		color: var(--muted-color);
		text-align: center;

		i {
			font-size: 1.5rem;
			opacity: 0.5;
		}

		p {
			font-size: var(--font-size-small);
		}
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

		.has-tooltip {
			text-decoration: underline dotted;
			text-underline-offset: 3px;
			text-decoration-color: var(--muted-color);
			cursor: help;
		}
	}
</style>
