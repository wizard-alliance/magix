<script lang="ts">
	import { browser } from "$app/environment"
	import { getRefreshToken } from "$lib/client/api"

	let loading = false
	let refreshToken = ""

	if (browser) {
		refreshToken = getRefreshToken().token
	}

	const handleLogout = async () => {
		if (!browser) return
		loading = true
		const res = await window.Request({
			method: "post",
			path: "/account/auth/logout",
			body: { refresh_token: refreshToken },
		})
		loading = false
		console.log(res.body.error ? "error" : "success", res.body.code, res.body.error)
	}
</script>

<section class="panel">
	<h2>Logout</h2>
	<p>POST /account/auth/logout with the current refresh token.</p>
	<form on:submit|preventDefault={handleLogout}>
		<div class="field">
			<label for="refreshToken">Refresh token</label>
			<input id="refreshToken" type="text" bind:value={refreshToken} autocomplete="off" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Logout</button>
		</div>
	</form>
</section>
