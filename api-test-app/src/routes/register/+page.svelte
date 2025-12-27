<script lang="ts">
	import { browser } from "$app/environment"

	let email = "demo@example.com"
	let username = "demo"
	let password = "changeme"
	let tosAccepted = true
	let loading = false

	const handleRegister = async () => {
		if (!browser) return
		loading = true
		const res = await window.Request({
			method: "post",
			path: "/account/register",
			body: { email, username, password, tos_accepted: tosAccepted },
		})
		loading = false
		console.log(res.body.error ? "error" : "success", res.body.code, res.body.error)
	}
</script>

<section class="panel">
	<h2>Register</h2>
	<form on:submit|preventDefault={handleRegister}>
		<div class="field">
			<label for="email">Email</label>
			<input id="email" type="email" bind:value={email} autocomplete="email" />
		</div>
		<div class="field">
			<label for="username">Username</label>
			<input id="username" type="text" bind:value={username} autocomplete="username" />
		</div>
		<div class="field">
			<label for="password">Password</label>
			<input id="password" type="password" bind:value={password} autocomplete="new-password" />
		</div>
		<div class="field">
			<label class="small">
				<input type="checkbox" bind:checked={tosAccepted} /> Accept TOS
			</label>
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Register</button>
		</div>
	</form>
</section>
