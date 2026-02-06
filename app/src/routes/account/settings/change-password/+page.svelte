<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Button from "$components/fields/button.svelte"

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
			status = "Password updated. Redirecting..."
			await app.Auth.logout()
			goto("/account/login")
		} catch (error) {
			status = `Error: ${(error as Error).message}`
		} finally {
			loading = false
		}
	}
</script>

<div class="page page-thin">
	<h1>Change Password</h1>

	<form class="form" on:submit|preventDefault={submit}>
		<Input id="currentPassword" label="Current password" type="password" bind:value={form.currentPassword} required />
		<Input id="newPassword" label="New password" type="password" bind:value={form.newPassword} required />

		<div class="actions">
			<Button type="submit" disabled={loading}>{loading ? "Updating..." : "Update password"}</Button>
			<a href="/account/settings">Cancel</a>
		</div>

		{#if status}
			<p class="status">{status}</p>
		{/if}
	</form>
</div>

<style>
	h1 {
		margin-bottom: calc(var(--gutter) * 2);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 1.5);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 2);
		margin-top: var(--gutter);
	}

	.actions a {
		color: var(--text-color-secondary);
		font-size: var(--font-size-small);
	}

	.status {
		color: var(--accent-color);
		margin-top: var(--gutter);
	}
</style>
