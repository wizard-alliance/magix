<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	let loading = true
	let saving = false
	let form = { firstName: "", lastName: "", phone: "", company: "", address: "" }

	onMount(async () => {
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
		loading = false
	})

	const save = async () => {
		saving = true
		try {
			const updated = await app.Auth.updateProfile(form)
			if (updated && app.State.currentUser?.set) app.State.currentUser.set(updated)
			app.Notify.success("Profile updated")
		} catch (error) {
			app.Notify.error(`Unable to save: ${(error as Error).message}`)
		} finally {
			saving = false
		}
	}
</script>

<div class="page page-thin">
	<div class="section margin-bottom-4">
		<h1 class="title">Account Details</h1>
		<p class="muted-color text-small">Update your personal information</p>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else}
		<div class="section margin-bottom-4">
			<div class="details">
				<form on:submit|preventDefault={save}>
					<div class="form-grid">
						<Input id="firstName" label="First name" bind:value={form.firstName} />
						<Input id="lastName" label="Last name" bind:value={form.lastName} />
					</div>
					<Input id="phone" label="Phone" type="tel" bind:value={form.phone} />
					<Input id="company" label="Company" bind:value={form.company} />
					<Input id="address" label="Address" bind:value={form.address} />

					<div class="actions">
						<Button type="submit" disabled={saving} loading={saving}>
							{saving ? "Saving..." : "Save changes"}
						</Button>
						<a href="/account/settings" class="muted-color text-small">Back to preferences</a>
					</div>
				</form>
			</div>
		</div>
	{/if}
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

	.form-grid {
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
</style>
