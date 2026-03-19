<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Select from "$components/fields/select.svelte"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	let loading = true
	let saving = false
	let form = {
		firstName: "",
		lastName: "",
		phone: "",
		company: "",
		addressLine1: "",
		addressLine2: "",
		city: "",
		state: "",
		zip: "",
		country: "",
		language: "",
	}

	const countryOptions = app.Meta.Country.options()
	const languageOptions = app.Meta.Language.options()

	onMount(async () => {
		const data = await app.Auth.me().catch(() => null)
		const info = data?.info
		if (info) {
			form = {
				firstName: info.firstName || "",
				lastName: info.lastName || "",
				phone: info.phone || "",
				company: info.company || "",
				addressLine1: info.addressLine1 || "",
				addressLine2: info.addressLine2 || "",
				city: info.city || "",
				state: info.state || "",
				zip: info.zip || "",
				country: info.country || "",
				language: info.language || "",
			}
		}
		loading = false
	})

	const save = async () => {
		saving = true
		try {
			const updated = await app.Auth.updateProfile(form)
			if (updated && app.State.currentUser?.set) app.State.currentUser.set(updated)
			app.UI.Notify.success("Profile updated", "Profile")
		} catch (error) {
			app.UI.Notify.error(app.Helpers.errMsg(error), "Profile")
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
					<div class="row">
						<div class="col-xxs-12 col-md-6">
							<Input id="firstName" label="First name" bind:value={form.firstName} />
						</div>
						<div class="col-xxs-12 col-md-6">
							<Input id="lastName" label="Last name" bind:value={form.lastName} />
						</div>
					</div>
					<Input id="phone" label="Phone" type="tel" bind:value={form.phone} />
					<Input id="company" label="Company" bind:value={form.company} />
					<Input id="addressLine1" label="Address line 1" bind:value={form.addressLine1} placeholder="Street address" />
					<Input id="addressLine2" label="Address line 2" bind:value={form.addressLine2} placeholder="Apartment, suite, etc." />
					<div class="row">
						<div class="col-xxs-12 col-md-6">
							<Input id="city" label="City" bind:value={form.city} />
						</div>
						<div class="col-xxs-12 col-md-6">
							<Input id="state" label="State / Region" bind:value={form.state} />
						</div>
					</div>
					<div class="row">
						<div class="col-xxs-12 col-md-6">
							<Input id="zip" label="ZIP / Postal code" bind:value={form.zip} />
						</div>
						<div class="col-xxs-12 col-md-6">
							<Select id="country" label="Country" bind:value={form.country} options={countryOptions} placeholder="Select country" />
						</div>
					</div>
					<Select id="language" label="Language" bind:value={form.language} options={languageOptions} placeholder="Select language" />

					<div class="actions">
						<Button type="submit" disabled={saving} loading={saving}>
							{saving ? "Saving..." : "Save changes"}
						</Button>
						<a href="/account/settings" class="muted-color text-small">Back to settings</a>
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

	.actions {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 2);
		margin-top: var(--gutter);
	}
</style>
