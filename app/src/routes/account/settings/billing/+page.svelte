<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	let loading = true
	let saving = false
	let form = {
		billingName: "",
		billingEmail: "",
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
			const data = await app.Account.Billing.get()
			if (data) form = { ...form, ...app.Account.Billing.toForm(data) }
		} catch {
			// No billing data yet — keep defaults
		}
		loading = false
	})

	const save = async () => {
		saving = true
		try {
			await app.Account.Billing.save(form)
			app.UI.Notify.success("Billing info saved")
		} catch (err) {
			app.UI.Notify.error(`Failed to save billing info: ${(err as Error).message}`)
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
					<div class="form-grid">
						<Input id="billingEmail" label="Billing email" type="email" bind:value={form.billingEmail} placeholder="billing@example.com" />
						<Input id="billingPhone" label="Billing phone" type="tel" bind:value={form.billingPhone} placeholder="+1 234 567 890" />
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
					<div class="form-grid">
						<Input id="city" label="City" bind:value={form.city} />
						<Input id="state" label="State / Region" bind:value={form.state} />
					</div>
					<div class="form-grid">
						<Input id="zip" label="ZIP / Postal code" bind:value={form.zip} />
						<Input id="country" label="Country" bind:value={form.country} />
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

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--gutter);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 2);
	}
</style>
