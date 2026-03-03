<script lang="ts">
	import Input from "$components/fields/input.svelte"
	import Select from "$components/fields/select.svelte"
	import Textarea from "$components/fields/textarea.svelte"
	import Button from "$components/fields/button.svelte"
	import { app } from "$lib/app"

	export let onsubmit: (data: any) => void = () => {}
	export let oncancel: () => void = () => {}
	export let feature: { featureName?: string; productId?: number; description?: string; sortOrder?: number } | null = null
	export let productOptions: { label: string; value: string }[] = []

	let featureName = feature?.featureName ?? ``
	let productId = feature?.productId ? String(feature.productId) : ``
	let description = feature?.description ?? ``
	let sortOrder = String(feature?.sortOrder ?? 0)

	const save = () => {
		if (!featureName.trim() || !productId) {
			app.UI.Notify.error(`Feature name and product are required`, `Validation`)
			return
		}
		onsubmit({
			featureName: featureName.trim(),
			productId: Number(productId),
			description: description.trim() || undefined,
			sortOrder: Number(sortOrder) || 0,
		})
	}
</script>

<div class="feature-form">
	<div class="row margin-bottom-2">
		<div class="col-xxs-12 col-md">
			<Input label="Feature name" bind:value={featureName} placeholder="e.g. Unlimited storage" />
		</div>
		<div class="col-xxs-12 col-md">
			<Select label="Product" bind:value={productId} options={productOptions} />
		</div>
	</div>
	<div class="row margin-bottom-2">
		<div class="col-xxs-12 col-md">
			<Input label="Sort order" type="number" bind:value={sortOrder} placeholder="0" />
		</div>
	</div>
	<div class="row margin-bottom-2">
		<div class="col-xxs-12">
			<Textarea label="Description" bind:value={description} placeholder="Optional description" rows={2} />
		</div>
	</div>
	<div class="row">
		<div class="col-xxs-auto">
			<Button on:click={save}>{feature ? `Update` : `Add Feature`}</Button>
		</div>
		<div class="col-xxs-auto">
			<Button on:click={oncancel} variant="secondary">Cancel</Button>
		</div>
	</div>
</div>
