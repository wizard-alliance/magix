<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let productId = ""
	let variantId = ""
	let subscriptionId = ""
	let customerId = ""
</script>

<section class="panel">
	<h2>LemonSqueezy → Sync</h2>
	<p>Sync data from LemonSqueezy to local database</p>

	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "post", path: "/billing/ls/sync" })
				loading = false
			}}>🔄 Sync All</button
		>
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "post", path: "/billing/ls/sync/products" })
				loading = false
			}}>🔄 Sync Products Only</button
		>
	</div>
</section>

<section class="panel">
	<h2>LemonSqueezy → Admin</h2>
	<p>Direct access to LemonSqueezy API (admin only)</p>

	<h3>Status</h3>
	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "get", path: "/billing/ls/status" })
				loading = false
			}}>Check LS Status</button
		>
	</div>

	<hr />

	<h3>Store</h3>
	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "get", path: "/billing/ls/store" })
				loading = false
			}}>Get Store Info</button
		>
	</div>
</section>

<section class="panel">
	<h2>Products & Variants</h2>

	<h3>List Products</h3>
	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "get", path: "/billing/ls/products" })
				loading = false
			}}>Get All Products</button
		>
	</div>

	<hr />

	<h3>Get Single Product</h3>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/ls/product", params: { id: productId } })
			loading = false
		}}
	>
		<div class="field">
			<label for="productId">Product ID</label>
			<input id="productId" type="text" bind:value={productId} placeholder="123456" />
		</div>
		<button type="submit" disabled={loading || !productId}>Get Product</button>
	</form>

	<hr />

	<h3>List Variants</h3>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/ls/variants", params: productId ? { product_id: productId } : {} })
			loading = false
		}}
	>
		<div class="field">
			<label for="variantProductId">Product ID (optional, filters variants)</label>
			<input id="variantProductId" type="text" bind:value={productId} placeholder="123456" />
		</div>
		<button type="submit" disabled={loading}>Get Variants</button>
	</form>

	<hr />

	<h3>Get Single Variant</h3>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/ls/variant", params: { id: variantId } })
			loading = false
		}}
	>
		<div class="field">
			<label for="variantId">Variant ID</label>
			<input id="variantId" type="text" bind:value={variantId} placeholder="456789" />
		</div>
		<button type="submit" disabled={loading || !variantId}>Get Variant</button>
	</form>
</section>

<section class="panel">
	<h2>Subscriptions</h2>

	<h3>List All Subscriptions</h3>
	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "get", path: "/billing/ls/subscriptions" })
				loading = false
			}}>Get All Subscriptions</button
		>
	</div>

	<hr />

	<h3>Get Single Subscription</h3>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/ls/subscription", params: { id: subscriptionId } })
			loading = false
		}}
	>
		<div class="field">
			<label for="subscriptionId">LS Subscription ID</label>
			<input id="subscriptionId" type="text" bind:value={subscriptionId} placeholder="sub_123" />
		</div>
		<button type="submit" disabled={loading || !subscriptionId}>Get Subscription</button>
	</form>
</section>

<section class="panel">
	<h2>Orders</h2>

	<h3>List All Orders</h3>
	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "get", path: "/billing/ls/orders" })
				loading = false
			}}>Get All Orders</button
		>
	</div>
</section>

<section class="panel">
	<h2>Customers</h2>

	<h3>List All Customers</h3>
	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "get", path: "/billing/ls/customers" })
				loading = false
			}}>Get All Customers</button
		>
	</div>

	<hr />

	<h3>Get Single Customer</h3>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/ls/customer", params: { id: customerId } })
			loading = false
		}}
	>
		<div class="field">
			<label for="customerId">LS Customer ID</label>
			<input id="customerId" type="text" bind:value={customerId} placeholder="cus_123" />
		</div>
		<button type="submit" disabled={loading || !customerId}>Get Customer</button>
	</form>
</section>
