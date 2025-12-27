<script lang="ts">
	let identifier = "demo"
	let password = "changeme"
	let loading = false

	const handleLogin = async () => {
		loading = true
		const res = await window.Request({
			method: "post",
			path: "/account/auth/login",
			body: { identifier: identifier, password: password },
		})
		console.log(res.body.error ? "error" : "success", res.body)
		loading = false
	}
</script>

<h1>Login</h1>
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

<style>
	.stack {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
</style>
