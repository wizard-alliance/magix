<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Button from "$components/fields/button.svelte"
	import Toggle from "$components/fields/toggle.svelte"

	let form = { currentPassword: "", newPassword: "" }
	let logoutAll = true
	let loading = false

	const submit = async () => {
		loading = true
		try {
			await app.Auth.changePassword(form.currentPassword, form.newPassword, logoutAll)
			app.Notify.success("Password updated. Redirecting...")
			await app.Auth.logout()
			goto("/auth/login")
		} catch (error) {
			app.Notify.error(`Error: ${(error as Error).message}`)
		} finally {
			loading = false
		}
	}
</script>

<div class="page page-thin">
	<div class="section margin-bottom-4">
		<h1 class="title">Change Password</h1>
		<p class="muted-color text-small">Update your account password</p>
	</div>

	<div class="section margin-bottom-4">
		<div class="details">
			<form on:submit|preventDefault={submit}>
				<Input id="currentPassword" label="Current password" type="password" bind:value={form.currentPassword} required />
				<Input id="newPassword" label="New password" type="password" bind:value={form.newPassword} required />

				<div class="toggle-row">
					<Toggle label="Log out all other devices" bind:checked={logoutAll} />
				</div>

				<div class="actions">
					<Button type="submit" disabled={loading} {loading}>
						{loading ? "Updating..." : "Update password"}
					</Button>
					<a href="/account/settings" class="muted-color text-small">Back to preferences</a>
				</div>
			</form>
		</div>
	</div>
</div>

<style lang="scss" scoped>
	.section .title {
		font-size: var(--font-size-large);
		font-weight: 600;
	}

	.details {
		background-color: rgba(255, 255, 255, 0.04);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 2.5);

		form {
			display: flex;
			flex-direction: column;
			gap: calc(var(--gutter) * 1.5);
		}
	}

	.toggle-row {
		padding: var(--gutter) 0;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 2);
		margin-top: var(--gutter);
	}
</style>
