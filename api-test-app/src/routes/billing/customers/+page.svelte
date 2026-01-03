<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let customerId = ""
	let userId = ""
	let companyId = ""
	let isGuest = false
	let billingName = ""
	let billingEmail = ""
	let billingPhone = ""
	let addressLine1 = ""
	let addressLine2 = ""
	let city = ""
	let state = ""
	let zip = ""
	let country = ""
	let vatId = ""

	const randomize = () => {
		const rand = Math.random().toString(36).slice(2, 8)
		const names = ["John Doe", "Jane Smith", "Bob Wilson", "Alice Brown", "Charlie Davis"]
		const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]
		const states = ["NY", "CA", "IL", "TX", "AZ"]
		const countries = ["US", "CA", "UK", "AU", "DE"]
		billingName = names[Math.floor(Math.random() * names.length)]
		billingEmail = `test_${rand}@example.com`
		billingPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`
		addressLine1 = `${Math.floor(100 + Math.random() * 9900)} Main St`
		addressLine2 = Math.random() > 0.5 ? `Apt ${Math.floor(1 + Math.random() * 999)}` : ""
		city = cities[Math.floor(Math.random() * cities.length)]
		state = states[Math.floor(Math.random() * states.length)]
		zip = String(Math.floor(10000 + Math.random() * 90000))
		country = countries[Math.floor(Math.random() * countries.length)]
		vatId = Math.random() > 0.7 ? `VAT${Math.floor(100000 + Math.random() * 900000)}` : ""
		isGuest = Math.random() > 0.8
	}
</script>

<section class="panel">
	<h2>Billing → Customers</h2>
	<p>Manage billing customers (admin only)</p>

	<h3>List All Customers</h3>
	<p>GET /billing/customers</p>
	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "get", path: "/billing/customers" })
				loading = false
			}}>Get All Customers</button
		>
	</div>

	<hr />

	<h3>Get Single Customer</h3>
	<p>GET /billing/customer</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/customer", params: { id: customerId } })
			loading = false
		}}
	>
		<div class="field">
			<label for="customerId">Customer ID</label>
			<input id="customerId" type="text" bind:value={customerId} placeholder="1" />
		</div>
		<button type="submit" disabled={loading}>Get Customer</button>
	</form>

	<hr />

	<h3>Create Customer</h3>
	<p>POST /billing/customer</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			const body: Record<string, any> = { is_guest: isGuest ? 1 : 0 }
			if (userId) body.user_id = Number(userId)
			if (companyId) body.company_id = Number(companyId)
			if (billingName) body.billing_name = billingName
			if (billingEmail) body.billing_email = billingEmail
			if (billingPhone) body.billing_phone = billingPhone
			if (addressLine1) body.billing_address_line1 = addressLine1
			if (addressLine2) body.billing_address_line2 = addressLine2
			if (city) body.billing_city = city
			if (state) body.billing_state = state
			if (zip) body.billing_zip = zip
			if (country) body.billing_country = country
			if (vatId) body.vat_id = vatId
			await window.Request({ method: "post", path: "/billing/customer", body })
			loading = false
		}}
	>
		<div style="margin-bottom: 1rem;">
			<button type="button" on:click={randomize}>🎲 Randomize Fields</button>
		</div>
		<div class="field">
			<label for="userId">User ID (optional)</label>
			<input id="userId" type="text" bind:value={userId} placeholder="1" />
		</div>
		<div class="field">
			<label for="companyId">Company ID (optional)</label>
			<input id="companyId" type="text" bind:value={companyId} placeholder="1" />
		</div>
		<div class="field">
			<label>
				<input type="checkbox" bind:checked={isGuest} /> Is Guest
			</label>
		</div>
		<div class="field">
			<label for="billingName">Billing Name</label>
			<input id="billingName" type="text" bind:value={billingName} placeholder="John Doe" />
		</div>
		<div class="field">
			<label for="billingEmail">Billing Email</label>
			<input id="billingEmail" type="email" bind:value={billingEmail} placeholder="john@example.com" />
		</div>
		<div class="field">
			<label for="billingPhone">Billing Phone</label>
			<input id="billingPhone" type="text" bind:value={billingPhone} placeholder="+1234567890" />
		</div>
		<div class="field">
			<label for="addressLine1">Address Line 1</label>
			<input id="addressLine1" type="text" bind:value={addressLine1} placeholder="123 Main St" />
		</div>
		<div class="field">
			<label for="addressLine2">Address Line 2</label>
			<input id="addressLine2" type="text" bind:value={addressLine2} placeholder="Apt 4B" />
		</div>
		<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
			<div class="field">
				<label for="city">City</label>
				<input id="city" type="text" bind:value={city} placeholder="New York" />
			</div>
			<div class="field">
				<label for="state">State</label>
				<input id="state" type="text" bind:value={state} placeholder="NY" />
			</div>
			<div class="field">
				<label for="zip">ZIP Code</label>
				<input id="zip" type="text" bind:value={zip} placeholder="10001" />
			</div>
			<div class="field">
				<label for="country">Country</label>
				<input id="country" type="text" bind:value={country} placeholder="US" />
			</div>
		</div>
		<div class="field">
			<label for="vatId">VAT ID (optional)</label>
			<input id="vatId" type="text" bind:value={vatId} placeholder="VAT123456" />
		</div>
		<button type="submit" disabled={loading}>Create Customer</button>
	</form>

	<hr />

	<h3>Update Customer</h3>
	<p>PUT /billing/customer</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			const body: Record<string, any> = { id: Number(customerId) }
			if (billingName) body.billing_name = billingName
			if (billingEmail) body.billing_email = billingEmail
			if (billingPhone) body.billing_phone = billingPhone
			if (addressLine1) body.billing_address_line1 = addressLine1
			if (addressLine2) body.billing_address_line2 = addressLine2
			if (city) body.billing_city = city
			if (state) body.billing_state = state
			if (zip) body.billing_zip = zip
			if (country) body.billing_country = country
			if (vatId) body.vat_id = vatId
			await window.Request({ method: "put", path: "/billing/customer", body })
			loading = false
		}}
	>
		<p class="hint">Use Customer ID and fields above</p>
		<button type="submit" disabled={loading || !customerId}>Update Customer</button>
	</form>

	<hr />

	<h3>Delete Customer</h3>
	<p>DELETE /billing/customer</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "delete", path: "/billing/customer", body: { id: Number(customerId) } })
			loading = false
		}}
	>
		<p class="hint">Use Customer ID above</p>
		<button type="submit" disabled={loading || !customerId}>Delete Customer</button>
	</form>
</section>
