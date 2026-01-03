<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let planId = ""
	let planName = ""
	let planPrice = ""
	let planCurrency = "USD"
	let planDescription = ""
	let providerPriceId = ""

	let featureId = ""
	let featureName = ""
	let featureDescription = ""
</script>

<section class="panel">
	<h2>Billing → Plans</h2>
	<p>Manage subscription plans (public read, admin write)</p>

	<h3>List All Plans</h3>
	<p>GET /billing/plans</p>
	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "get", path: "/billing/plans" })
				loading = false
			}}>Get All Plans</button
		>
	</div>

	<hr />

	<h3>Get Single Plan</h3>
	<p>GET /billing/plan</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/plan", params: { id: planId } })
			loading = false
		}}
	>
		<div class="field">
			<label for="planId">Plan ID</label>
			<input id="planId" type="text" bind:value={planId} placeholder="1" />
		</div>
		<button type="submit" disabled={loading}>Get Plan</button>
	</form>

	<hr />

	<h3>Create Plan</h3>
	<p>POST /billing/plan (admin)</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({
				method: "post",
				path: "/billing/plan",
				body: {
					name: planName,
					price: Number(planPrice),
					currency: planCurrency,
					description: planDescription || null,
					provider_price_id: providerPriceId || null,
					is_active: 1,
				},
			})
			loading = false
		}}
	>
		<div class="field">
			<label for="planName">Plan Name</label>
			<input id="planName" type="text" bind:value={planName} placeholder="Pro Plan" />
		</div>
		<div class="field">
			<label for="planPrice">Price (cents)</label>
			<input id="planPrice" type="number" bind:value={planPrice} placeholder="999" />
		</div>
		<div class="field">
			<label for="planCurrency">Currency</label>
			<input id="planCurrency" type="text" bind:value={planCurrency} placeholder="USD" />
		</div>
		<div class="field">
			<label for="planDescription">Description</label>
			<input id="planDescription" type="text" bind:value={planDescription} placeholder="Best plan ever" />
		</div>
		<div class="field">
			<label for="providerPriceId">Provider Price ID</label>
			<input id="providerPriceId" type="text" bind:value={providerPriceId} placeholder="price_xxx" />
		</div>
		<button type="submit" disabled={loading}>Create Plan</button>
	</form>

	<hr />

	<h3>Update Plan</h3>
	<p>PUT /billing/plan (admin)</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			const body: Record<string, any> = { id: Number(planId) }
			if (planName) body.name = planName
			if (planPrice) body.price = Number(planPrice)
			if (planDescription) body.description = planDescription
			await window.Request({ method: "put", path: "/billing/plan", body })
			loading = false
		}}
	>
		<p class="hint">Use Plan ID and fields above</p>
		<button type="submit" disabled={loading || !planId}>Update Plan</button>
	</form>

	<hr />

	<h3>Delete Plan</h3>
	<p>DELETE /billing/plan (admin)</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "delete", path: "/billing/plan", body: { id: Number(planId) } })
			loading = false
		}}
	>
		<p class="hint">Use Plan ID above</p>
		<button type="submit" disabled={loading || !planId}>Delete Plan</button>
	</form>
</section>

<section class="panel">
	<h2>Plan Features</h2>
	<p>Manage features for plans (admin only)</p>

	<h3>List Features for Plan</h3>
	<p>GET /billing/plan/features</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/plan/features", params: { plan_id: planId } })
			loading = false
		}}
	>
		<p class="hint">Use Plan ID above</p>
		<button type="submit" disabled={loading}>Get Features</button>
	</form>

	<hr />

	<h3>Create Feature</h3>
	<p>POST /billing/plan/feature (admin)</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({
				method: "post",
				path: "/billing/plan/feature",
				body: {
					plan_id: Number(planId),
					feature_name: featureName,
					description: featureDescription || null,
				},
			})
			loading = false
		}}
	>
		<div class="field">
			<label for="featureName">Feature Name</label>
			<input id="featureName" type="text" bind:value={featureName} placeholder="Unlimited Storage" />
		</div>
		<div class="field">
			<label for="featureDescription">Description</label>
			<input id="featureDescription" type="text" bind:value={featureDescription} placeholder="Store unlimited files" />
		</div>
		<p class="hint">Uses Plan ID above</p>
		<button type="submit" disabled={loading || !planId}>Create Feature</button>
	</form>

	<hr />

	<h3>Update Feature</h3>
	<p>PUT /billing/plan/feature (admin)</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			const body: Record<string, any> = { id: Number(featureId) }
			if (featureName) body.feature_name = featureName
			if (featureDescription) body.description = featureDescription
			await window.Request({ method: "put", path: "/billing/plan/feature", body })
			loading = false
		}}
	>
		<div class="field">
			<label for="featureId">Feature ID</label>
			<input id="featureId" type="text" bind:value={featureId} placeholder="1" />
		</div>
		<p class="hint">Use Feature Name/Description above</p>
		<button type="submit" disabled={loading || !featureId}>Update Feature</button>
	</form>

	<hr />

	<h3>Delete Feature</h3>
	<p>DELETE /billing/plan/feature (admin)</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "delete", path: "/billing/plan/feature", body: { id: Number(featureId) } })
			loading = false
		}}
	>
		<p class="hint">Use Feature ID above</p>
		<button type="submit" disabled={loading || !featureId}>Delete Feature</button>
	</form>
</section>
