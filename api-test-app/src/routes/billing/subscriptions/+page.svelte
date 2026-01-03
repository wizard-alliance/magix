<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let subscriptionId = ""
</script>

<section class="panel">
	<h2>Billing → Subscriptions</h2>
	<p>View subscriptions (admin only)</p>

	<h3>List All Subscriptions</h3>
	<p>GET /billing/subscriptions</p>
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
</section>
