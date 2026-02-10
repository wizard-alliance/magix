<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	// ─── LS Status ─────────────────────────────────
	let lsEnabled: boolean | null = null
	let lsLoading = true

	// ─── Sync ──────────────────────────────────────
	let syncing = false

	// ─── Store Info ────────────────────────────────
	let storeInfo: any = null
	let storeLoading = false

	// ─── Webhook Simulator ─────────────────────────
	let simLoading = false
	let userId = `1`
	let planId = `1`
	let subscriptionId = `sub_123`
	let orderId = `ord_456`
	let amount = `1999`
	let currency = `USD`

	const coreEvents = [
		{ name: `order_created`, label: `Order Created` },
		{ name: `order_refunded`, label: `Order Refunded` },
		{ name: `subscription_created`, label: `Subscription Created` },
		{ name: `subscription_cancelled`, label: `Subscription Cancelled` },
		{ name: `subscription_expired`, label: `Subscription Expired` },
		{ name: `subscription_payment_success`, label: `Payment Success` },
		{ name: `subscription_payment_failed`, label: `Payment Failed` },
		{ name: `customer_created`, label: `Customer Created` },
		{ name: `customer_updated`, label: `Customer Updated` },
	]

	const optionalEvents = [
		{ name: `subscription_updated`, label: `Sub Updated` },
		{ name: `subscription_resumed`, label: `Sub Resumed` },
		{ name: `subscription_paused`, label: `Sub Paused` },
		{ name: `subscription_unpaused`, label: `Sub Unpaused` },
		{ name: `subscription_payment_recovered`, label: `Payment Recovered` },
		{ name: `subscription_payment_refunded`, label: `Payment Refunded` },
		{ name: `subscription_plan_changed`, label: `Plan Changed` },
	]

	const randomize = () => {
		userId = String(Math.floor(1 + Math.random() * 100))
		planId = String(Math.floor(1 + Math.random() * 10))
		subscriptionId = `sub_${Math.random().toString(36).slice(2, 10)}`
		orderId = `ord_${Math.random().toString(36).slice(2, 10)}`
		amount = String(Math.floor(499 + Math.random() * 5000))
		currency = [`USD`, `EUR`, `GBP`, `NOK`][Math.floor(Math.random() * 4)]
	}

	const triggerEvent = async (eventName: string) => {
		simLoading = true
		try {
			await app.System.Request.post(`/billing/webhook`, {
				body: {
					meta: {
						event_name: eventName,
						custom_data: { user_id: userId, plan_id: planId },
					},
					data: {
						attributes: {
							id: eventName.includes(`order`) ? orderId : subscriptionId,
							subscription_id: subscriptionId,
							user_name: `Test User`,
							user_email: `test@example.com`,
							total: Number(amount),
							currency,
							status: `active`,
							current_period_start: new Date().toISOString(),
							renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
							cancelled: eventName === `subscription_cancelled`,
						},
					},
				},
			})
			app.UI.Notify.success(`Event fired: ${eventName}`)
		} catch (err) {
			app.UI.Notify.error(`Event failed: ${app.Helpers.errMsg(err)}`)
		}
		simLoading = false
	}

	const checkStatus = async () => {
		lsLoading = true
		try {
			const res = await app.Commerce.Admin.LS.status()
			lsEnabled = res?.enabled ?? false
		} catch {
			lsEnabled = false
		}
		lsLoading = false
	}

	// Generic sync runner — wraps any LS sync method with loading state + notifications
	const runSync = async (fn: () => Promise<any>, label: string) => {
		syncing = true
		try {
			await fn()
			app.UI.Notify.success(`${label} synced`)
		} catch (err) {
			app.UI.Notify.error(`Sync failed: ${app.Helpers.errMsg(err)}`)
		}
		syncing = false
	}

	// Each wrapper delegates to runSync — button handlers stay unchanged
	const syncProducts = () => runSync(() => app.Commerce.Admin.LS.syncProducts(), `Products`)
	const syncCustomers = () => runSync(() => app.Commerce.Admin.LS.syncCustomers(), `Customers`)
	const syncOrders = () => runSync(() => app.Commerce.Admin.LS.syncOrders(), `Orders`)
	const syncSubscriptions = () => runSync(() => app.Commerce.Admin.LS.syncSubscriptions(), `Subscriptions`)
	const syncInvoices = () => runSync(() => app.Commerce.Admin.LS.syncInvoices(), `Invoices`)
	const syncAll = () => runSync(() => app.Commerce.Admin.LS.sync(), `Full sync`)

	const loadStore = async () => {
		storeLoading = true
		try {
			storeInfo = await app.Commerce.Admin.LS.getStore()
		} catch {
			app.UI.Notify.error(`Failed to load store info`)
		}
		storeLoading = false
	}

	onMount(checkStatus)
</script>

<div class="page page-normal">
	<!-- LS Tools Section -->
	<div class="section margin-bottom-4">
		<h1 class="title"><i class="fa-light fa-flask"></i> Commerce Tools</h1>
		<p class="muted-color text-small">LemonSqueezy administration and webhook testing</p>
	</div>

	<div class="section margin-bottom-4">
		<div class="row middle-xs margin-bottom-2">
			<div class="col-xxs">
				<h2 class="title"><i class="fa-light fa-lemon"></i> LemonSqueezy</h2>
				<p class="muted-color text-small">Provider status and sync tools</p>
			</div>
		</div>
		<div class="details">
			<div class="status-row">
				<span class="muted-color">Status:</span>
				{#if lsLoading}
					<Spinner />
				{:else}
					<span class={lsEnabled ? `status-active` : `status-inactive`}>
						{lsEnabled ? `Enabled` : `Disabled`}
					</span>
				{/if}
			</div>
			<div class="actions-row">
				<Button on:click={syncProducts} loading={syncing} disabled={syncing} variant="ghost" size="sm">
					<i class="fa-light fa-arrows-rotate"></i> Sync Products
				</Button>
				<Button on:click={syncCustomers} loading={syncing} disabled={syncing} variant="ghost" size="sm">
					<i class="fa-light fa-arrows-rotate"></i> Sync Customers
				</Button>
				<Button on:click={syncOrders} loading={syncing} disabled={syncing} variant="ghost" size="sm">
					<i class="fa-light fa-arrows-rotate"></i> Sync Orders
				</Button>
				<Button on:click={syncSubscriptions} loading={syncing} disabled={syncing} variant="ghost" size="sm">
					<i class="fa-light fa-arrows-rotate"></i> Sync Subscriptions
				</Button>
				<Button on:click={syncInvoices} loading={syncing} disabled={syncing} variant="ghost" size="sm">
					<i class="fa-light fa-arrows-rotate"></i> Sync Invoices
				</Button>
				<Button on:click={syncAll} loading={syncing} disabled={syncing} variant="ghost" size="sm">
					<i class="fa-light fa-arrows-rotate"></i> Full Sync
				</Button>
				<Button on:click={loadStore} loading={storeLoading} disabled={storeLoading} variant="ghost" size="sm">
					<i class="fa-light fa-store"></i> Store Info
				</Button>
			</div>
			{#if storeInfo}
				<pre class="store-info">{JSON.stringify(storeInfo, null, 2)}</pre>
			{/if}
		</div>
	</div>

	<!-- Webhook Event Simulator -->
	<div class="section margin-bottom-4">
		<div class="row middle-xs margin-bottom-2">
			<div class="col-xxs">
				<h2 class="title"><i class="fa-light fa-bolt"></i> Webhook Simulator</h2>
				<p class="muted-color text-small">Fire test webhook events in dev mode</p>
			</div>
			<div class="col-xxs-auto">
				<Button on:click={randomize} variant="ghost" size="sm">
					<i class="fa-light fa-dice"></i> Randomize
				</Button>
			</div>
		</div>
		<div class="details">
			<div class="sim-params">
				<Input id="simUserId" label="User ID" bind:value={userId} />
				<Input id="simPlanId" label="Plan ID" bind:value={planId} />
				<Input id="simSubId" label="Subscription ID" bind:value={subscriptionId} />
				<Input id="simOrderId" label="Order ID" bind:value={orderId} />
				<Input id="simAmount" label="Amount (cents)" bind:value={amount} />
				<Input id="simCurrency" label="Currency" bind:value={currency} />
			</div>

			<div class="events-section">
				<h3 class="subtitle">Core Events</h3>
				<div class="event-grid">
					{#each coreEvents as event}
						<Button variant="ghost" size="sm" disabled={simLoading} on:click={() => triggerEvent(event.name)}>
							{event.label}
						</Button>
					{/each}
				</div>
			</div>

			<div class="events-section">
				<h3 class="subtitle">Optional Events</h3>
				<div class="event-grid">
					{#each optionalEvents as event}
						<Button variant="ghost" size="sm" disabled={simLoading} on:click={() => triggerEvent(event.name)}>
							{event.label}
						</Button>
					{/each}
				</div>
			</div>
		</div>
	</div>
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

	.subtitle {
		font-size: var(--font-size-small);
		font-weight: 600;
		margin-bottom: calc(var(--gutter) * 1);
		opacity: 0.7;
	}

	.details {
		background-color: rgba(255, 255, 255, 0.04);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 2.5);
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 2);
	}

	.status-row {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 1);
	}

	.status-active {
		color: var(--success-color, #4ade80);
		font-weight: 600;
	}

	.status-inactive {
		color: var(--danger-color, #f87171);
		font-weight: 600;
	}

	.actions-row {
		display: flex;
		flex-wrap: wrap;
		gap: calc(var(--gutter) * 1);
	}

	.store-info {
		font-size: var(--font-size-small);
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 1.5);
		overflow-x: auto;
		max-height: 300px;
	}

	.sim-params {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: calc(var(--gutter) * 1.5);
	}

	.events-section {
		margin-top: calc(var(--gutter) * 1);
	}

	.event-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: calc(var(--gutter) * 1);
	}
</style>
