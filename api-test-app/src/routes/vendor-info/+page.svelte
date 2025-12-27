<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false

	const handleVendorInfo = async () => {
		if (!browser) return
		loading = true
		const res = await window.Request({ method: "post", path: "/account/auth/vendor/discord", body: {} })
		loading = false
		console.log(res.body.error ? "error" : "success", res.body.code, res.body.error)
	}
</script>

<section class="panel">
	<h2>Vendor Info (Discord)</h2>
	<p>POST /account/auth/vendor/discord</p>
	<div class="stack">
		<button type="button" disabled={loading} on:click={handleVendorInfo}>Fetch vendor info</button>
	</div>
</section>
