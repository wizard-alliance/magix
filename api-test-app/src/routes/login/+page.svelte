<script lang="ts">
	import { browser } from "$app/environment"

	let identifier = "demo"
	let password = "changeme"
	let loading = false

	const handleLogin = async () => {
		if (!browser) return
		loading = true
		const res = await window.Request({
			method: "post",
			path: "/account/auth/login",
			body: { identifier, password },
		})
		loading = false
		console.log(res.body.error ? "error" : "success", res.body.code, res.body.error)
	}
</script>

<section class="panel">
	<h2>Login</h2>
	<form on:submit|preventDefault={handleLogin}>
		<div class="field">
			<label for="identifier">Identifier</label>
			<input id="identifier" type="text" bind:value={identifier} autocomplete="username" />
		</div>
		<div class="field">
			<label for="password">Password</label>
			<input id="password" type="password" bind:value={password} autocomplete="current-password" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Login</button>
		</div>
	</form>
</section>

<style>
	.stack {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
</style>
