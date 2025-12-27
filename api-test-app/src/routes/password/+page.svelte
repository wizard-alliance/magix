<script lang="ts">
	import { browser } from "$app/environment"

	let currentPassword = "changeme"
	let newPassword = "super-secret-123"
	let logoutAll = true
	let loading = false

	const handleChangePassword = async () => {
		if (!browser) return
		loading = true
		const res = await window.Request({
			method: "post",
			path: "/account/auth/password",
			body: {
				current_password: currentPassword,
				new_password: newPassword,
				logout_all: logoutAll,
			},
		})
		loading = false
		console.log(res.body.error ? "error" : "success", res.body.code, res.body.error)
	}
</script>

<section class="panel">
	<h2>Change Password</h2>
	<form on:submit|preventDefault={handleChangePassword}>
		<div class="field">
			<label for="currentPassword">Current password</label>
			<input id="currentPassword" type="password" bind:value={currentPassword} autocomplete="current-password" />
		</div>
		<div class="field">
			<label for="newPassword">New password</label>
			<input id="newPassword" type="password" bind:value={newPassword} autocomplete="new-password" />
		</div>
		<div class="field">
			<label class="small">
				<input type="checkbox" bind:checked={logoutAll} /> Logout all sessions
			</label>
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Update password</button>
		</div>
	</form>
</section>
