<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let orderId = ""
</script>

<section class="panel">
	<h2>Billing → Orders</h2>
	<p>View orders (admin only)</p>

	<h3>List All Orders</h3>
	<p>GET /billing/orders</p>
	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "get", path: "/billing/orders" })
				loading = false
			}}>Get All Orders</button
		>
	</div>

	<hr />

	<h3>Get Single Order</h3>
	<p>GET /billing/order</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/order", params: { id: orderId } })
			loading = false
		}}
	>
		<div class="field">
			<label for="orderId">Order ID</label>
			<input id="orderId" type="text" bind:value={orderId} placeholder="1" />
		</div>
		<button type="submit" disabled={loading}>Get Order</button>
	</form>
</section>
