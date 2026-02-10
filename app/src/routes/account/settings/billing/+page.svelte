<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	let loading = true
	let saving = false
	let accountEmail = ""
	let form = {
		billingName: "",
		billingPhone: "",
		addressLine1: "",
		addressLine2: "",
		city: "",
		state: "",
		zip: "",
		country: "",
		vatId: "",
	}

	onMount(async () => {
		try {
			const user = await app.Auth.me()
			accountEmail = user?.info?.email || ""
			const data = await app.Commerce.Customer.get()
			if (data) form = { ...form, ...app.Commerce.Customer.toForm(data) }
		} catch {
			// No billing data yet — keep defaults
		}
		loading = false
	})

	const save = async () => {
		saving = true
		try {
			await app.Commerce.Customer.saveMe(form)
			app.UI.Notify.success("Billing info saved")
		} catch (err) {
			app.UI.Notify.error(`Failed to save billing info: ${app.Helpers.errMsg(err)}`)
		} finally {
			saving = false
		}
	}
</script>

<div class="page page-thin">
	<div class="section margin-bottom-4">
		<h1 class="title">Billing Information</h1>
		<p class="muted-color text-small">Your billing name, address, and tax details</p>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else}
		<div class="section margin-bottom-4">
			<div class="row middle-xs margin-bottom-2">
				<div class="col-xxs">
					<h2 class="title"><i class="fa-light fa-user"></i> Contact</h2>
					<p class="muted-color text-small">Who invoices are addressed to</p>
				</div>
			</div>
			<div class="details">
				<form on:submit|preventDefault={save}>
					<Input id="billingName" label="Billing name" bind:value={form.billingName} placeholder="Full name or company" />
					<div class="row">
						<div class="col-xxs-12 col-md-6">
							<Input id="billingEmail" label="Billing email" type="email" value={accountEmail} disabled />
							<a href="/account/settings/email" class="helper-link">Change email address</a>
						</div>
						<div class="col-xxs-12 col-md-6">
							<Input id="billingPhone" label="Billing phone" type="tel" bind:value={form.billingPhone} placeholder="+1 234 567 890" />
						</div>
					</div>
					<Input id="vatId" label="VAT / Tax ID" bind:value={form.vatId} placeholder="Optional" helperText="Required for business invoices in some regions" />
				</form>
			</div>
		</div>

		<div class="section margin-bottom-4">
			<div class="row middle-xs margin-bottom-2">
				<div class="col-xxs">
					<h2 class="title"><i class="fa-light fa-location-dot"></i> Address</h2>
					<p class="muted-color text-small">Billing address for invoices</p>
				</div>
			</div>
			<div class="details">
				<form on:submit|preventDefault={save}>
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
							<Input id="country" label="Country" bind:value={form.country} />
						</div>
					</div>
				</form>
			</div>
		</div>

		<div class="section">
			<div class="actions">
				<Button on:click={save} loading={saving} disabled={saving}>
					{saving ? "Saving..." : "Save billing info"}
				</Button>
			</div>
		</div>
	{/if}
</div>

<style lang="scss" scoped>
	.section .title {
		font-size: var(--font-size-large);
		font-weight: 600;

		i {
			margin-right: calc(var(--gutter) * 0.75);
			opacity: 0.6;
		}
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

	.helper-link {
		display: inline-block;
		margin-top: calc(var(--gutter) * 0.5);
		font-size: var(--font-size-small);
		opacity: 0.6;
		&:hover {
			opacity: 1;
		}
	}

	.actions {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 2);
	}
</style>
