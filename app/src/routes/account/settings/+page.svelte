<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Button from "$components/fields/button.svelte"

	let status = ""
	let loading = false
	let form = { firstName: "", lastName: "", phone: "", company: "", address: "" }

	onMount(() => {
		app.Config.pageTitle = "Account Settings"
		loadProfile()
	})

	const loadProfile = async () => {
		const data = await app.Auth.me().catch(() => null)
		const info = data?.info
		if (info) {
			form = {
				firstName: info.firstName || "",
				lastName: info.lastName || "",
				phone: info.phone || "",
				company: info.company || "",
				address: info.address || "",
			}
		}
	}

	const saveProfile = async () => {
		loading = true
		status = ""
		try {
			const updated = await app.Auth.updateProfile(form)
			status = "Profile updated"
			if (updated && app.State.currentUser?.set) {
				app.State.currentUser.set(updated)
			}
		} catch (error) {
			status = `Unable to save: ${(error as Error).message}`
		} finally {
			loading = false
		}
	}
</script>

<div class="page page-thin">
	<h1>Account Settings</h1>

	<form class="form" on:submit|preventDefault={saveProfile}>
		<div class="row-2">
			<Input id="firstName" label="First name" bind:value={form.firstName} />
			<Input id="lastName" label="Last name" bind:value={form.lastName} />
		</div>
		<Input id="phone" label="Phone" type="tel" bind:value={form.phone} />
		<Input id="company" label="Company" bind:value={form.company} />
		<Input id="address" label="Address" bind:value={form.address} />

		<div class="actions">
			<Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
			<a href="/account/settings/password">Change password</a>
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

	.row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--gutter);
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
