<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let subscriptionId = ""
	let variantId = ""
	let planId = ""
	let redirectUrl = ""
</script>

<section class="panel">
	<h2>Billing → Subscriptions</h2>
	<p>View and manage subscriptions</p>

	<h3>List All Subscriptions</h3>
	<p>GET /billing/subscriptions (admin)</p>
	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "get", path: "/billing/subscriptions" })
				loading = false
			}}>Get All Subscriptions</button
		>
	</div>

	<hr />

	<h3>Get Single Subscription</h3>
	<p>GET /billing/subscription</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/subscription", params: { id: subscriptionId } })
			loading = false
		}}
	>
		<div class="field">
			<label for="subscriptionId">Subscription ID</label>
			<input id="subscriptionId" type="text" bind:value={subscriptionId} placeholder="1" />
		</div>
		<button type="submit" disabled={loading}>Get Subscription</button>
	</form>

	<hr />

	<h3>Subscription Actions</h3>
	<p>Manage subscription via LemonSqueezy (use Subscription ID above)</p>
	<div class="stack" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem;">
		<button
			type="button"
			disabled={loading || !subscriptionId}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "post", path: "/billing/subscription/cancel", body: { id: Number(subscriptionId) } })
				loading = false
			}}>Cancel</button
		>
		<button
			type="button"
			disabled={loading || !subscriptionId}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "post", path: "/billing/subscription/pause", body: { id: Number(subscriptionId) } })
				loading = false
			}}>Pause</button
		>
		<button
			type="button"
			disabled={loading || !subscriptionId}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "post", path: "/billing/subscription/resume", body: { id: Number(subscriptionId) } })
				loading = false
			}}>Resume</button
		>
	</div>
</section>

<section class="panel">
	<h2>Checkout</h2>
	<p>Create a LemonSqueezy checkout URL</p>

	<h3>Create Checkout</h3>
	<p>POST /billing/checkout</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({
				method: "post",
				path: "/billing/checkout",
				body: {
					variant_id: variantId,
					plan_id: planId || undefined,
					redirect_url: redirectUrl || undefined,
				},
			})
			loading = false
		}}
	>
		<div class="field">
			<label for="variantId">LS Variant ID</label>
			<input id="variantId" type="text" bind:value={variantId} placeholder="123456" />
		</div>
		<div class="field">
			<label for="planId">Local Plan ID (optional)</label>
			<input id="planId" type="text" bind:value={planId} placeholder="1" />
		</div>
		<div class="field">
			<label for="redirectUrl">Redirect URL (optional)</label>
			<input id="redirectUrl" type="text" bind:value={redirectUrl} placeholder="https://yourapp.com/success" />
		</div>
		<button type="submit" disabled={loading || !variantId}>Create Checkout</button>
	</form>
</section>
