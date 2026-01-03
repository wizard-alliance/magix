<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let productId = ""
	let productName = ""
	let productType = "subscription"
	let productPrice = ""
	let productCurrency = "USD"
	let productInterval = "month"
	let productIntervalCount = "1"
	let productDescription = ""
	let providerVariantId = ""

	let featureId = ""
	let featureName = ""
	let featureDescription = ""
</script>

<section class="panel">
	<h2>Billing → Products</h2>
	<p>Manage billing products (public read, admin write)</p>

	<h3>List All Products</h3>
	<p>GET /billing/products</p>
	<div class="stack">
		<button
			type="button"
			disabled={loading}
			on:click={async () => {
				if (!browser) return
				loading = true
				await window.Request({ method: "get", path: "/billing/products" })
				loading = false
			}}>Get All Products</button
		>
	</div>

	<hr />

	<h3>Get Single Product</h3>
	<p>GET /billing/product</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/product", params: { id: productId } })
			loading = false
		}}
	>
		<div class="field">
			<label for="productId">Product ID</label>
			<input id="productId" type="text" bind:value={productId} placeholder="1" />
		</div>
		<button type="submit" disabled={loading}>Get Product</button>
	</form>

	<hr />

	<h3>Create Product</h3>
	<p>POST /billing/product (admin)</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({
				method: "post",
				path: "/billing/product",
				body: {
					name: productName,
					type: productType,
					price: Number(productPrice),
					currency: productCurrency,
					interval: productInterval,
					interval_count: Number(productIntervalCount),
					description: productDescription || null,
					provider_variant_id: providerVariantId || null,
					is_active: 1,
				},
			})
			loading = false
		}}
	>
		<div class="field">
			<label for="productName">Product Name</label>
			<input id="productName" type="text" bind:value={productName} placeholder="Pro Plan" />
		</div>
		<div class="field">
			<label for="productType">Type</label>
			<select id="productType" bind:value={productType}>
				<option value="subscription">Subscription</option>
				<option value="one_time">One-Time</option>
				<option value="lead_magnet">Lead Magnet</option>
				<option value="pwyw">Pay What You Want</option>
			</select>
		</div>
		<div class="field">
			<label for="productPrice">Price (cents)</label>
			<input id="productPrice" type="number" bind:value={productPrice} placeholder="999" />
		</div>
		<div class="field">
			<label for="productCurrency">Currency</label>
			<input id="productCurrency" type="text" bind:value={productCurrency} placeholder="USD" />
		</div>
		<div class="field">
			<label for="productInterval">Interval</label>
			<select id="productInterval" bind:value={productInterval}>
				<option value="day">Day</option>
				<option value="week">Week</option>
				<option value="month">Month</option>
				<option value="year">Year</option>
			</select>
		</div>
		<div class="field">
			<label for="productIntervalCount">Interval Count</label>
			<input id="productIntervalCount" type="number" bind:value={productIntervalCount} placeholder="1" />
		</div>
		<div class="field">
			<label for="productDescription">Description</label>
			<input id="productDescription" type="text" bind:value={productDescription} placeholder="Best plan ever" />
		</div>
		<div class="field">
			<label for="providerVariantId">Provider Variant ID</label>
			<input id="providerVariantId" type="text" bind:value={providerVariantId} placeholder="123456" />
		</div>
		<button type="submit" disabled={loading}>Create Product</button>
	</form>

	<hr />

	<h3>Update Product</h3>
	<p>PUT /billing/product (admin)</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			const body: Record<string, any> = { id: Number(productId) }
			if (productName) body.name = productName
			if (productPrice) body.price = Number(productPrice)
			if (productDescription) body.description = productDescription
			await window.Request({ method: "put", path: "/billing/product", body })
			loading = false
		}}
	>
		<p class="hint">Use Product ID and fields above</p>
		<button type="submit" disabled={loading || !productId}>Update Product</button>
	</form>

	<hr />

	<h3>Delete Product</h3>
	<p>DELETE /billing/product (admin)</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "delete", path: "/billing/product", body: { id: Number(productId) } })
			loading = false
		}}
	>
		<p class="hint">Use Product ID above</p>
		<button type="submit" disabled={loading || !productId}>Delete Product</button>
	</form>
</section>

<section class="panel">
	<h2>Product Features</h2>
	<p>Manage features for products (admin only)</p>

	<h3>List Features for Product</h3>
	<p>GET /billing/product/features</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "get", path: "/billing/product/features", params: { product_id: productId } })
			loading = false
		}}
	>
		<p class="hint">Use Product ID above</p>
		<button type="submit" disabled={loading}>Get Features</button>
	</form>

	<hr />

	<h3>Create Feature</h3>
	<p>POST /billing/product/feature (admin)</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({
				method: "post",
				path: "/billing/product/feature",
				body: {
					product_id: Number(productId),
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
		<p class="hint">Uses Product ID above</p>
		<button type="submit" disabled={loading || !productId}>Create Feature</button>
	</form>

	<hr />

	<h3>Update Feature</h3>
	<p>PUT /billing/product/feature (admin)</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			const body: Record<string, any> = { id: Number(featureId) }
			if (featureName) body.feature_name = featureName
			if (featureDescription) body.description = featureDescription
			await window.Request({ method: "put", path: "/billing/product/feature", body })
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
	<p>DELETE /billing/product/feature (admin)</p>
	<form
		on:submit|preventDefault={async () => {
			if (!browser) return
			loading = true
			await window.Request({ method: "delete", path: "/billing/product/feature", body: { id: Number(featureId) } })
			loading = false
		}}
	>
		<p class="hint">Use Feature ID above</p>
		<button type="submit" disabled={loading || !featureId}>Delete Feature</button>
	</form>
</section>
