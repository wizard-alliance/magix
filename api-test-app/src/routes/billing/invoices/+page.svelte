<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let invoiceId = ""
</script>

<section class="panel">
	<h2>Billing → Invoices</h2>
	<p>View invoices (admin only)</p>

	<h3>List All Invoices</h3>
	<p>GET /billing/invoices</p>
	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "get", path: "/billing/invoices" })
				loading = false
			}}>Get All Invoices</button
		>
	</div>

	<hr />

	<h3>Get Single Invoice</h3>
	<p>GET /billing/invoice</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/invoice", params: { id: invoiceId } })
			loading = false
		}}
	>
		<div class="field">
			<label for="invoiceId">Invoice ID</label>
			<input id="invoiceId" type="text" bind:value={invoiceId} placeholder="1" />
		</div>
		<button type="submit" disabled={loading}>Get Invoice</button>
	</form>
</section>
