<script lang="ts">
	import { browser } from "$app/environment"
	import { getRefreshToken } from "$lib/client/api"

	let refreshToken = ""
	let loading = false

	if (browser) {
		refreshToken = getRefreshToken().token
	}

	const handleRefresh = async () => {
		if (!browser) return
		loading = true
		const res = await window.Request({
			method: "post",
			path: "/account/auth/refresh",
			body: { refresh_token: refreshToken },
		})
		loading = false
		console.log(res.body.error ? "error" : "success", res.body.code, res.body.error)
	}
</script>

<section class="panel">
	<h2>Refresh Tokens</h2>
	<form on:submit|preventDefault={handleRefresh}>
		<div class="field">
			<label for="refreshToken">Refresh token</label>
			<input id="refreshToken" type="text" bind:value={refreshToken} autocomplete="off" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Refresh</button>
		</div>
	</form>
</section>
