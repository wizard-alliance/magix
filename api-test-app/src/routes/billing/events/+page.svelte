<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let customerId = "1"
	let orderId = "1"
	let subscriptionId = "1"
	let planId = "1"
	let amount = "9.99"
	let currency = "USD"
	let status = "paid"

	const randomize = () => {
		customerId = String(Math.floor(1 + Math.random() * 100))
		orderId = String(Math.floor(1 + Math.random() * 1000))
		subscriptionId = String(Math.floor(1 + Math.random() * 500))
		planId = String(Math.floor(1 + Math.random() * 10))
		amount = (Math.random() * 99 + 1).toFixed(2)
		currency = ["USD", "EUR", "GBP", "CAD", "AUD"][Math.floor(Math.random() * 5)]
		status = ["pending", "paid", "failed"][Math.floor(Math.random() * 3)]
	}

	const events = [
		{ name: "order_created", label: "Order Created" },
		{ name: "order_refunded", label: "Order Refunded" },
		{ name: "subscription_created", label: "Subscription Created" },
		{ name: "subscription_updated", label: "Subscription Updated" },
		{ name: "subscription_canceled", label: "Subscription Canceled" },
		{ name: "subscription_resumed", label: "Subscription Resumed" },
		{ name: "subscription_expired", label: "Subscription Expired" },
		{ name: "subscription_paused", label: "Subscription Paused" },
		{ name: "subscription_unpaused", label: "Subscription Unpaused" },
		{ name: "subscription_payment_success", label: "Payment Success" },
		{ name: "subscription_payment_failed", label: "Payment Failed" },
		{ name: "subscription_payment_recovered", label: "Payment Recovered" },
	]

	const triggerEvent = async (eventName: string) => {
		if (!browser) return
		loading = true
		await window.Request({
			method: "post",
			path: "/billing/webhook",
			body: {
				meta: { event_name: eventName },
				data: {
					id: "test_" + Date.now(),
					customer_id: Number(customerId),
					order_id: Number(orderId),
					subscription_id: Number(subscriptionId),
					plan_id: Number(planId),
					amount: Math.round(parseFloat(amount) * 100),
					currency,
					status,
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
		<button type="button" on:click={randomize}>🎲 Randomize Fields</button>
	</div>
	<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-bottom: 1rem;">
		<div class="field">
			<label for="customerId">Customer ID</label>
			<input id="customerId" type="text" bind:value={customerId} />
		</div>
		<div class="field">
			<label for="orderId">Order ID</label>
			<input id="orderId" type="text" bind:value={orderId} />
		</div>
		<div class="field">
			<label for="subscriptionId">Subscription ID</label>
			<input id="subscriptionId" type="text" bind:value={subscriptionId} />
		</div>
		<div class="field">
			<label for="planId">Plan ID</label>
			<input id="planId" type="text" bind:value={planId} />
		</div>
		<div class="field">
			<label for="amount">Amount ($)</label>
			<input id="amount" type="text" bind:value={amount} placeholder="9.99" />
		</div>
		<div class="field">
			<label for="currency">Currency</label>
			<input id="currency" type="text" bind:value={currency} />
		</div>
		<div class="field">
			<label for="status">Status</label>
			<select id="status" bind:value={status}>
				<option value="pending">pending</option>
				<option value="paid">paid</option>
				<option value="failed">failed</option>
				<option value="refunded">refunded</option>
				<option value="canceled">canceled</option>
			</select>
		</div>
	</div>

	<hr />

	<h3>Trigger Events</h3>
	<p>POST /billing/webhook</p>

	<div class="stack" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
		{#each events as event}
			<button type="button" disabled={loading} on:click={() => triggerEvent(event.name)}>
				{event.label}
			</button>
		{/each}
	</div>
</section>
