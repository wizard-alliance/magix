<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"

	let form = { currentPassword: "", newPassword: "" }
	let status = ""
	let loading = false

	onMount(() => {
		app.Config.pageTitle = "Change Password"
	})

	const submit = async () => {
		loading = true
		status = ""
		try {
			await app.Auth.changePassword(form.currentPassword, form.newPassword, true)
			status = "Password updated. Please log in again."
			await app.Auth.logout()
			goto("/account/login")
		} catch (error) {
			status = `Unable to change password: ${(error as Error).message}`
		} finally {
			loading = false
		}
	}
</script>

<section class="panel">
	<h1>Change Password</h1>
	<form class="stack" on:submit|preventDefault={submit}>
		<label>
			<span>Current password</span>
			<input type="password" bind:value={form.currentPassword} required />
		</label>
		<label>
			<span>New password</span>
			<input type="password" bind:value={form.newPassword} required />
		</label>
		<button type="submit" disabled={loading}>Update password</button>
	</form>
	{#if status}
		<p class="status">{status}</p>
	{/if}
</section>

<style>
	.panel {
		max-width: 520px;
		margin: 0 auto;
		background: #0f0f14;
		padding: calc(var(--gutter) * 2);
		border-radius: 12px;
		border: 1px solid #222230;
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--gutter);
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	input {
		background: #0d0d12;
		border: 1px solid #2a2a35;
		border-radius: 8px;
		color: white;
		padding: 10px 12px;
	}

	button {
		background: linear-gradient(135deg, #06b6d4, #3b82f6);
		color: white;
		border: none;
		border-radius: 10px;
		padding: 12px;
		cursor: pointer;
		font-weight: 600;
	}

	.status {
		margin-top: var(--gutter);
		color: #60a5fa;
	}
</style>
