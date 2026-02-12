<script lang="ts">
	import { app } from "$lib/app"
	import { page } from "$app/stores"
	import { onMount } from "svelte"
	import type { BillingProductFull } from "$lib/types/commerce"
	import Spinner from "$components/modules/spinner.svelte"
	import Button from "$components/fields/button.svelte"
	import Input from "$components/fields/input.svelte"
	import Select from "$components/fields/select.svelte"
	import Toggle from "$components/fields/toggle.svelte"
	import Textarea from "$components/fields/textarea.svelte"

	let loading = true
	let saving = false
	let product: BillingProductFull | null = null

	$: productId = Number($page.params.id)

	let name = ``
	let type = ``
	let price = ``
	let currency = ``
	let interval = ``
	let intervalCount = ``
	let trialDays = ``
	let sortOrder = ``
	let description = ``
	let isActive = false

	const typeOptions = [
		{ label: `Subscription`, value: `subscription` },
		{ label: `One-time`, value: `one_time` },
	]

	const intervalOptions = [
		{ label: `Day`, value: `day` },
		{ label: `Week`, value: `week` },
		{ label: `Month`, value: `month` },
		{ label: `Year`, value: `year` },
	]

	const populate = (p: BillingProductFull) => {
		name = p.name
		type = p.type
		price = String(p.price)
		currency = p.currency
		interval = p.interval
		intervalCount = String(p.intervalCount)
		trialDays = String(p.trialDays)
		sortOrder = String(p.sortOrder)
		description = p.description ?? ``
		isActive = p.isActive
	}

	onMount(async () => {
		if (!productId) {
			app.UI.Notify.error(`No product ID provided`)
			loading = false
			return
		}
		try {
			product = await app.Commerce.Products.get({ id: productId })
			if (product) populate(product)
			else app.UI.Notify.error(`Product not found`)
		} catch {
			app.UI.Notify.error(`Failed to load product`)
		}
		loading = false
	})

	const save = async () => {
		if (!product) return
		saving = true
		try {
			await app.Commerce.Products.update(
				{ id: product.id },
				{
					sortOrder: Number(sortOrder),
					description: description || null,
					isActive,
				},
			)
			app.UI.Notify.success(`Product updated`)
		} catch (err) {
			app.UI.Notify.error(`Save failed: ${app.Helpers.errMsg(err)}`)
		}
		saving = false
	}
</script>

<div class="page page-thin">
	<div class="section margin-bottom-4">
		<div class="row middle-xs">
			<div class="col-xxs">
				<h1 class="title"><i class="fa-light fa-pen"></i> Edit Product</h1>
				<p class="muted-color text-small">{product?.name ?? `Loading...`}</p>
			</div>
			<div class="col-xxs-auto">
				<Button href="/admin/commerce/products" variant="secondary">
					<i class="fa-light fa-arrow-left"></i> Back
				</Button>
			</div>
		</div>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else if !product}
		<div class="section">
			<p class="muted-color">Product not found.</p>
		</div>
	{:else}
		<div class="banner">
			<i class="fa-light fa-lock"></i>
			<span
				>Most fields are synced from LemonSqueezy and cannot be edited here. To change pricing or intervals, update the product in your LemonSqueezy dashboard and re-sync.</span
			>
		</div>

		<div class="section margin-bottom-4">
			<div class="row margin-bottom-2">
				<div class="col-xxs-12 col-md">
					<Input label="Name" bind:value={name} disabled />
				</div>
				<div class="col-xxs-12 col-md">
					<Select label="Type" bind:value={type} options={typeOptions} disabled />
				</div>
			</div>
			<div class="row margin-bottom-2">
				<div class="col-xxs-12 col-md-4">
					<Input label="Price" bind:value={price} disabled />
				</div>
				<div class="col-xxs-12 col-md-4">
					<Input label="Currency" bind:value={currency} disabled />
				</div>
				<div class="col-xxs-12 col-md-4">
					<Select label="Interval" bind:value={interval} options={intervalOptions} disabled />
				</div>
			</div>
			<div class="row margin-bottom-2">
				<div class="col-xxs-12 col-md-4">
					<Input label="Interval Count" bind:value={intervalCount} disabled />
				</div>
				<div class="col-xxs-12 col-md-4">
					<Input label="Trial Days" bind:value={trialDays} disabled />
				</div>
				<div class="col-xxs-12 col-md-4">
					<Input label="Sort Order" bind:value={sortOrder} placeholder="0" />
				</div>
			</div>
			<div class="row margin-bottom-2">
				<div class="col-xxs-12">
					<Textarea label="Description" bind:value={description} rows={3} />
				</div>
			</div>
			<div class="row margin-bottom-4">
				<div class="col-xxs-12">
					<Toggle label="Active" labelPosition="right" bind:checked={isActive} />
				</div>
			</div>
		</div>

		{#if product.features?.length}
			<div class="section margin-bottom-4">
				<h3 class="subtitle">Features ({product.features.length})</h3>
				<ul class="features-list">
					{#each product.features as feature}
						<li><i class="fa-solid fa-check"></i> {feature.featureName}</li>
					{/each}
				</ul>
				<div class="margin-top-2">
					<Button href="/admin/commerce/features" variant="secondary">
						<i class="fa-light fa-stars"></i> Manage Features
					</Button>
				</div>
			</div>
		{/if}

		<div class="section">
			<Button on:click={save} loading={saving} disabled={saving}>
				{saving ? `Saving...` : `Save Product`}
			</Button>
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
		margin-bottom: calc(var(--gutter) * 1.5);
	}

	.banner {
		display: flex;
		align-items: flex-start;
		gap: calc(var(--gutter) * 0.75);
		padding: calc(var(--gutter) * 1.25);
		margin-bottom: calc(var(--gutter) * 2);
		border-radius: var(--border-radius);
		background: color-mix(in srgb, var(--warning-color) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--warning-color) 25%, transparent);
		font-size: var(--font-size-small);
		color: var(--muted-color);
		line-height: 1.5;

		i {
			color: var(--warning-color);
			margin-top: 2px;
			flex-shrink: 0;
		}
	}

	.features-list {
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
