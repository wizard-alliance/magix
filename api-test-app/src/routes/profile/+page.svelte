<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false

	const handleProfile = async () => {
		if (!browser) return
		loading = true
		const res = await window.Request({ method: "post", path: "/account/me", body: {} })
		loading = false
		console.log(res.body.error ? "error" : "success", res.body.code, res.body.error)
	}
</script>

<section class="panel">
	<h2>Profile</h2>
	<p>POST /account/me</p>
	<div class="stack">
		<button type="button" disabled={loading} on:click={handleProfile}>Fetch profile</button>
	</div>
</section>
