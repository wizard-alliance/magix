<script lang="ts">
	import { browser } from "$app/environment"

	let code = "sandbox-code"
	let token = "sandbox-code"
	let email = "demo+discord@example.com"
	let loading = false

	const handleVendorLogin = async () => {
		if (!browser) return
		loading = true
		const res = await window.Request({
			method: "post",
			path: "/account/auth/vendor/discord/login",
			body: { code, token, email },
		})
		loading = false
		console.log(res.body.error ? "error" : "success", res.body.code, res.body.error)
	}
</script>

<section class="panel">
	<h2>Login with Discord</h2>
	<form on:submit|preventDefault={handleVendorLogin}>
		<div class="field">
			<label for="code">Code</label>
			<input id="code" type="text" bind:value={code} autocomplete="off" />
		</div>
		<div class="field">
			<label for="token">Token</label>
			<input id="token" type="text" bind:value={token} autocomplete="off" />
		</div>
		<div class="field">
			<label for="email">Email</label>
			<input id="email" type="email" bind:value={email} autocomplete="email" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Login</button>
		</div>
	</form>
</section>
