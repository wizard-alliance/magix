/**
 * BillingEvents - Handles webhook events from MoR (LemonSqueezy)
 * All DB writes come through here, triggered by external events
 */

export type LemonSqueezyEventType =
	| "order_created"
	| "order_refunded"
	| "subscription_created"
	| "subscription_updated"
	| "subscription_canceled"
	| "subscription_resumed"
	| "subscription_expired"
	| "subscription_paused"
	| "subscription_unpaused"
	| "subscription_payment_success"
	| "subscription_payment_failed"
	| "subscription_payment_recovered"

export type BillingEventPayload = {
	event: LemonSqueezyEventType
	data: Record<string, any>
}

export class BillingEvents {
	private handlers: Map<LemonSqueezyEventType, (data: any) => Promise<void>> = new Map()

	constructor() {
		this.registerHandlers()
	}

	private registerHandlers() {
		this.handlers.set("order_created", this.onOrderCreated.bind(this))
		this.handlers.set("order_refunded", this.onOrderRefunded.bind(this))
		this.handlers.set("subscription_created", this.onSubscriptionCreated.bind(this))
		this.handlers.set("subscription_updated", this.onSubscriptionUpdated.bind(this))
		this.handlers.set("subscription_canceled", this.onSubscriptionCanceled.bind(this))
		this.handlers.set("subscription_resumed", this.onSubscriptionResumed.bind(this))
		this.handlers.set("subscription_expired", this.onSubscriptionExpired.bind(this))
		this.handlers.set("subscription_paused", this.onSubscriptionPaused.bind(this))
		this.handlers.set("subscription_unpaused", this.onSubscriptionUnpaused.bind(this))
		this.handlers.set("subscription_payment_success", this.onPaymentSuccess.bind(this))
		this.handlers.set("subscription_payment_failed", this.onPaymentFailed.bind(this))
		this.handlers.set("subscription_payment_recovered", this.onPaymentRecovered.bind(this))
	}

	async process(payload: BillingEventPayload): Promise<{ success: boolean; error?: string }> {
		const handler = this.handlers.get(payload.event)
		if (!handler) return { success: false, error: `Unknown event: ${payload.event}` }
		try {
			await handler(payload.data)
			return { success: true }
		} catch (e: any) {
			return { success: false, error: e.message }
		}
	}

	// Event handlers - implement MoR-specific logic here
	private async onOrderCreated(data: any) { /* TODO: Create order record */ }
	private async onOrderRefunded(data: any) { /* TODO: Update order status */ }
	private async onSubscriptionCreated(data: any) { /* TODO: Create subscription */ }
	private async onSubscriptionUpdated(data: any) { /* TODO: Update subscription */ }
	private async onSubscriptionCanceled(data: any) { /* TODO: Mark canceled */ }
	private async onSubscriptionResumed(data: any) { /* TODO: Reactivate */ }
	private async onSubscriptionExpired(data: any) { /* TODO: Mark expired */ }
	private async onSubscriptionPaused(data: any) { /* TODO: Mark paused */ }
	private async onSubscriptionUnpaused(data: any) { /* TODO: Unpause */ }
	private async onPaymentSuccess(data: any) { /* TODO: Record payment */ }
	private async onPaymentFailed(data: any) { /* TODO: Handle failure */ }
	private async onPaymentRecovered(data: any) { /* TODO: Mark recovered */ }
}
