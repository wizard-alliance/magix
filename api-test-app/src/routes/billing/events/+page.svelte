<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let userId = "1"
	let planId = "1"
	let subscriptionId = "sub_123"
	let orderId = "ord_456"
	let amount = "1999"
	let currency = "USD"

	const randomize = () => {
		userId = String(Math.floor(1 + Math.random() * 100))
		planId = String(Math.floor(1 + Math.random() * 10))
		subscriptionId = `sub_${Math.random().toString(36).slice(2, 10)}`
		orderId = `ord_${Math.random().toString(36).slice(2, 10)}`
		amount = String(Math.floor(499 + Math.random() * 5000))
		currency = ["USD", "EUR", "GBP", "NOK"][Math.floor(Math.random() * 4)]
	}

	const coreEvents = [
		{ name: "order_created", label: "Order Created" },
		{ name: "order_refunded", label: "Order Refunded" },
		{ name: "subscription_created", label: "Subscription Created" },
		{ name: "subscription_cancelled", label: "Subscription Cancelled" },
		{ name: "subscription_expired", label: "Subscription Expired" },
		{ name: "subscription_payment_success", label: "Payment Success" },
		{ name: "subscription_payment_failed", label: "Payment Failed" },
	]

	const optionalEvents = [
		{ name: "subscription_updated", label: "Subscription Updated" },
		{ name: "subscription_resumed", label: "Subscription Resumed" },
		{ name: "subscription_paused", label: "Subscription Paused" },
		{ name: "subscription_unpaused", label: "Subscription Unpaused" },
		{ name: "subscription_payment_recovered", label: "Payment Recovered" },
		{ name: "subscription_payment_refunded", label: "Payment Refunded" },
		{ name: "subscription_plan_changed", label: "Plan Changed" },
	]

	const triggerEvent = async (eventName: string) => {
		if (!browser) return
		loading = true
		await window.Request({
			method: "post",
			path: "/billing/webhook",
			body: {
				meta: {
					event_name: eventName,
					custom_data: { user_id: userId, plan_id: planId },
				},
				data: {
					attributes: {
						id: eventName.includes("order") ? orderId : subscriptionId,
						subscription_id: subscriptionId,
						user_name: "Test User",
						user_email: "test@example.com",
						total: Number(amount),
						currency,
						status: "active",
						current_period_start: new Date().toISOString(),
						renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
						cancelled: eventName === "subscription_cancelled",
					},
				},
			},
		})
		loading = false
	}
</script>

<section class="panel">
	<h2>Billing → Events</h2>
	<p>Simulate LemonSqueezy webhook events (testing)</p>

	<h3>Event Parameters</h3>
	<div style="margin-bottom: 1rem;">
		<button type="button" on:click={randomize}>🎲 Randomize</button>
	</div>
	<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem;">
		<div class="field">
			<label for="userId">User ID (custom_data)</label>
			<input id="userId" type="text" bind:value={userId} />
		</div>
		<div class="field">
			<label for="planId">Plan ID (custom_data)</label>
			<input id="planId" type="text" bind:value={planId} />
		</div>
		<div class="field">
			<label for="subscriptionId">LS Subscription ID</label>
			<input id="subscriptionId" type="text" bind:value={subscriptionId} />
		</div>
		<div class="field">
			<label for="orderId">LS Order ID</label>
			<input id="orderId" type="text" bind:value={orderId} />
		</div>
		<div class="field">
			<label for="amount">Amount (cents)</label>
			<input id="amount" type="text" bind:value={amount} />
		</div>
		<div class="field">
			<label for="currency">Currency</label>
			<input id="currency" type="text" bind:value={currency} />
		</div>
	</div>

	<hr />

	<h3>Core Events</h3>
	<p>These are the main events you'll use</p>
	<div class="stack" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
		{#each coreEvents as event}
			<button type="button" disabled={loading} on:click={() => triggerEvent(event.name)}>
				{event.label}
			</button>
		{/each}
	</div>

	<hr />

	<h3>Optional Events</h3>
	<p>Additional events (stubs or situational)</p>
	<div class="stack" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
		{#each optionalEvents as event}
			<button type="button" disabled={loading} on:click={() => triggerEvent(event.name)}>
				{event.label}
			</button>
		{/each}
	</div>
</section>
