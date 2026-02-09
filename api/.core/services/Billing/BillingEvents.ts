/**
 * BillingEvents - Handles webhook events from MoR (LemonSqueezy)
 * All DB writes come through here, triggered by external events
 */

export type LemonSqueezyEventType =
	// Core events
	| "order_created"
	| "order_refunded"
	| "subscription_created"
	| "subscription_cancelled"
	| "subscription_expired"
	| "subscription_payment_success"
	| "subscription_payment_failed"
	// Customer events
	| "customer_created"
	| "customer_updated"
	// Optional events
	| "subscription_updated"
	| "subscription_resumed"
	| "subscription_paused"
	| "subscription_unpaused"
	| "subscription_payment_recovered"
	| "subscription_payment_refunded"
	| "subscription_plan_changed"
	| "license_key_created"
	| "license_key_updated"
	| "affiliate_activated"

export type BillingEventPayload = {
	event: LemonSqueezyEventType
	data: Record<string, any>
	customData: Record<string, any>
}

export class BillingEvents {
	private prefix = "BillingEvents"
	private handlers: Map<LemonSqueezyEventType, (data: any, customData: any) => Promise<void>> = new Map()

	constructor() {
		this.registerHandlers()
	}

	private registerHandlers() {
		// Core events
		this.handlers.set("order_created", this.onOrderCreated.bind(this))
		this.handlers.set("order_refunded", this.onOrderRefunded.bind(this))
		this.handlers.set("subscription_created", this.onSubscriptionCreated.bind(this))
		this.handlers.set("subscription_cancelled", this.onSubscriptionCancelled.bind(this))
		this.handlers.set("subscription_expired", this.onSubscriptionExpired.bind(this))
		this.handlers.set("subscription_payment_success", this.onPaymentSuccess.bind(this))
		this.handlers.set("subscription_payment_failed", this.onPaymentFailed.bind(this))
		// Customer events
		this.handlers.set("customer_created", this.onCustomerCreated.bind(this))
		this.handlers.set("customer_updated", this.onCustomerUpdated.bind(this))
		// Optional events
		this.handlers.set("subscription_updated", this.onSubscriptionUpdated.bind(this))
		this.handlers.set("subscription_resumed", this.onSubscriptionResumed.bind(this))
		this.handlers.set("subscription_paused", this.onSubscriptionPaused.bind(this))
		this.handlers.set("subscription_unpaused", this.onSubscriptionUnpaused.bind(this))
		this.handlers.set("subscription_payment_recovered", this.onPaymentRecovered.bind(this))
		this.handlers.set("subscription_payment_refunded", this.onPaymentRefunded.bind(this))
		this.handlers.set("subscription_plan_changed", this.onPlanChanged.bind(this))
		this.handlers.set("license_key_created", this.onLicenseKeyCreated.bind(this))
		this.handlers.set("license_key_updated", this.onLicenseKeyUpdated.bind(this))
		this.handlers.set("affiliate_activated", this.onAffiliateActivated.bind(this))
	}

	async process(payload: BillingEventPayload): Promise<{ success: boolean; error?: string }> {
		const handler = this.handlers.get(payload.event)
		if (!handler) return { success: false, error: `Unknown event: ${payload.event}` }
		try {
			await handler(payload.data, payload.customData)
			return { success: true }
		} catch (e: any) {
			return { success: false, error: e.message }
		}
	}

	private async findOrCreateCustomer(data: any, customData: any) {
		const email = data.user_email
		const lsCustomerId = data.customer_id ? String(data.customer_id) : null

		if (!email && !lsCustomerId) {
			api.Log(`No email or customer_id in webhook data, cannot resolve customer`, this.prefix)
			return null
		}

		// 1. Lookup by provider_customer_id (fastest, most reliable)
		if (lsCustomerId) {
			const byProvider = await api.Billing.Customers.getMany({ provider_customer_id: lsCustomerId })
			if (byProvider[0]) {
				api.Log(`Found customer by provider_customer_id: ${byProvider[0].id}`, this.prefix)
				return byProvider[0]
			}
		}

		// 2. Resolve user_id from customData or email lookup (trusted identity)
		const user = email ? await api.User.Repo.get(email) : null
		const userId = customData?.user_id ? Number(customData.user_id) : user?.id || null

		// 3. Lookup by user_id — takes priority over email
		let customer = null as any
		if (userId) {
			customer = await api.Billing.Customers.get({ user_id: userId })
			if (customer) {
				api.Log(`Found existing billing customer by user_id: ${customer.id}`, this.prefix)
				const backfill: Record<string, any> = {}
				if (lsCustomerId && !customer.providerCustomerId) backfill.provider_customer_id = lsCustomerId
				if (email && !customer.billingEmail) backfill.billing_email = email
				if (Object.keys(backfill).length) await api.Billing.Customers.update(backfill, { id: customer.id })
				return customer
			}
		}

		// 4. Fallback: lookup by email (least trusted — covers guest purchases)
		customer = email ? await api.Billing.Customers.get({ billing_email: email }) : null
		if (customer) {
			api.Log(`Found existing billing customer by email: ${customer.id}`, this.prefix)
			if (lsCustomerId && !customer.providerCustomerId) {
				await api.Billing.Customers.update({ provider_customer_id: lsCustomerId }, { id: customer.id })
			}
			return customer
		}

		// 5. Create new billing_customer (guest if no userId)
		api.Log(`Creating billing customer for email: ${email}, user_id: ${userId}`, this.prefix)
		try {
			const result = await api.Billing.Customers.set({
				...(userId ? { user_id: userId } : { is_guest: 1 }),
				billing_name: data.user_name || data.name || null,
				billing_email: email,
				provider_customer_id: lsCustomerId,
			})
			api.Log(`Billing.Customers.set result: ${JSON.stringify(result)}`, this.prefix)
			if (`id` in result && result.id) {
				customer = await api.Billing.Customers.get({ id: result.id })
				return customer
			}
			if (`error` in result) api.Log(`Billing.Customers.set error: ${result.error}`, this.prefix)
		} catch (e: any) {
			api.Log(`Error creating billing customer: ${e.message}`, this.prefix)
		}

		return null
	}

	private async onOrderCreated(data: any, customData: any) {
		api.Log(`Event triggered: order_created`, this.prefix)

		const customer = await this.findOrCreateCustomer(data, customData)
		if (!customer) return

		try {
			const result = await api.Billing.Orders.set({
				customer_id: customer.id,
				type: `purchase`,
				provider_order_id: String(data.id),
				provider_id: 1, // LS
				amount: data.total,
				currency: data.currency,
				status: data.status === `paid` ? `paid` : `pending`,
				paid_at: data.status === `paid` ? new Date().toISOString().slice(0, 19).replace(`T`, ` `) : null,
			})
			api.Log(`Order created: ${JSON.stringify(result)}`, this.prefix)

			// Auto-create invoice
			const orderId = Number((result as any)?.id ?? (result as any)?.insertId)
			if (orderId) {
				try {
					await api.Billing.Invoices.set({
						order_id: orderId,
						customer_id: customer.id,
						billing_info_snapshot: JSON.stringify(customer.billingAddress ?? {}),
						billing_order_snapshot: JSON.stringify({ amount: data.total, currency: data.currency, status: data.status }),
					})
				} catch { /* invoice creation is best-effort */ }
			}
		} catch (e: any) {
			api.Log(`Error creating order: ${e.message}`, this.prefix)
		}
	}

	private async onOrderRefunded(data: any, _customData: any) {
		api.Log(`Event triggered: order_refunded`, this.prefix)
		await api.Billing.Orders.update(
			{ status: `refunded` },
			{ provider_order_id: String(data.id) }
		)
	}

	/** Convert ISO date to MySQL datetime format */
	private toMySQLDate(isoDate: string | null | undefined): string | undefined {
		if (!isoDate) return undefined
		return new Date(isoDate).toISOString().slice(0, 19).replace('T', ' ')
	}

	private async onSubscriptionCreated(data: any, customData: any) {
		api.Log(`Event triggered: subscription_created`, this.prefix)
		const customer = await this.findOrCreateCustomer(data, customData)
		if (!customer) return

		try {
			const result = await api.Billing.Subscriptions.set({
				customer_id: customer.id,
				plan_id: customData?.plan_id ? Number(customData.plan_id) : undefined,
				provider_subscription_id: String(data.id),
				status: data.status,
				current_period_start: this.toMySQLDate(data.created_at),
				current_period_end: this.toMySQLDate(data.renews_at),
				cancel_at_period_end: 0,
			})
			api.Log(`Subscription created: ${JSON.stringify(result)}`, this.prefix)
		} catch (e: any) {
			api.Log(`Error creating subscription: ${e.message}`, this.prefix)
		}
	}

	private async onSubscriptionUpdated(data: any, _customData: any) {
		api.Log(`Event triggered: subscription_updated`, this.prefix)
		await api.Billing.Subscriptions.update({
			status: data.status,
			current_period_start: this.toMySQLDate(data.current_period_start),
			current_period_end: this.toMySQLDate(data.renews_at),
		}, { provider_subscription_id: String(data.id) })
	}

	private async onSubscriptionCancelled(data: any, _customData: any) {
		api.Log(`Event triggered: subscription_cancelled`, this.prefix)
		await api.Billing.Subscriptions.update({
			status: data.status || `cancelled`,
			canceled_at: this.toMySQLDate(new Date().toISOString()),
			cancel_at_period_end: data.cancelled ? 1 : 0,
		} as any, { provider_subscription_id: String(data.id) })
	}

	private async onSubscriptionResumed(data: any, _customData: any) {
		api.Log(`Event triggered: subscription_resumed`, this.prefix)
		await api.Billing.Subscriptions.update({
			status: `active`,
			canceled_at: null,
			cancel_at_period_end: 0,
		}, { provider_subscription_id: String(data.id) })
	}

	private async onSubscriptionExpired(data: any, _customData: any) {
		api.Log(`Event triggered: subscription_expired`, this.prefix)
		await api.Billing.Subscriptions.update({
			status: `canceled`,
		}, { provider_subscription_id: String(data.id) })
	}

	private async onSubscriptionPaused(data: any, _customData: any) {
		api.Log(`Event triggered: subscription_paused`, this.prefix)
		// Note: schema doesn't have 'paused', using cancel_at_period_end as pause indicator
		await api.Billing.Subscriptions.update({
			cancel_at_period_end: 1,
		}, { provider_subscription_id: String(data.id) })
	}

	private async onSubscriptionUnpaused(data: any, _customData: any) {
		api.Log(`Event triggered: subscription_unpaused`, this.prefix)
		await api.Billing.Subscriptions.update({
			status: `active`,
		}, { provider_subscription_id: String(data.id) })
	}

	private async onPaymentSuccess(data: any, customData: any) {
		api.Log(`Event triggered: subscription_payment_success`, this.prefix)
		const sub = await api.Billing.Subscriptions.get({ provider_subscription_id: String(data.subscription_id) })
		if (!sub) return

		await api.Billing.Orders.set({
			customer_id: sub.customerId,
			type: `subscription`,
			subscription_id: sub.id,
			provider_id: 1,
			provider_order_id: String(data.id),
			amount: data.total,
			currency: data.currency,
			status: `paid`,
			paid_at: new Date().toISOString().slice(0, 19).replace(`T`, ` `),
		})

		// Auto-create invoice for renewal
		const recentOrders = await api.Billing.Orders.getMany({ provider_order_id: String(data.id) })
		const newOrder = recentOrders[0]
		if (newOrder) {
			try {
				const cust = await api.Billing.Customers.get({ id: sub.customerId })
				await api.Billing.Invoices.set({
					order_id: newOrder.id,
					customer_id: sub.customerId,
					billing_info_snapshot: JSON.stringify(cust?.billingAddress ?? {}),
					billing_order_snapshot: JSON.stringify({ amount: data.total, currency: data.currency, status: `paid` }),
				})
			} catch { /* best-effort */ }
		}

		await api.Billing.Subscriptions.update({
			status: `active`,
			current_period_end: data.renews_at,
		}, { id: sub.id })
	}

	private async onPaymentFailed(data: any, _customData: any) {
		api.Log(`Event triggered: subscription_payment_failed`, this.prefix)
		// Note: schema doesn't have 'past_due', keeping active but could add flag
		await api.Billing.Subscriptions.update({
			cancel_at_period_end: 1,
		}, { provider_subscription_id: String(data.subscription_id) })
	}

	private async onPaymentRecovered(data: any, _customData: any) {
		api.Log(`Event triggered: subscription_payment_recovered`, this.prefix)
		await api.Billing.Subscriptions.update({
			status: `active`,
		}, { provider_subscription_id: String(data.subscription_id) })
	}

	// ─────────────────────────────────────────────────────────────
	// Optional / Future handlers (empty stubs)
	// ─────────────────────────────────────────────────────────────

	private async onCustomerCreated(data: any, customData: any) {
		api.Log(`Event triggered: customer_created`, this.prefix)
		await this.findOrCreateCustomer(data, customData)
	}

	private async onCustomerUpdated(data: any, _customData: any) {
		api.Log(`Event triggered: customer_updated`, this.prefix)
		const lsCustomerId = data.id ? String(data.id) : null
		if (!lsCustomerId) return

		const customers = await api.Billing.Customers.getMany({ provider_customer_id: lsCustomerId })
		const customer = customers[0]
		if (!customer) {
			api.Log(`customer_updated: no local customer for LS ${lsCustomerId}`, this.prefix)
			return
		}

		const updateData: Record<string, any> = {}
		if (data.name !== undefined) updateData.billing_name = data.name
		if (data.email !== undefined) updateData.billing_email = data.email
		if (data.city !== undefined) updateData.billing_city = data.city
		if (data.region !== undefined) updateData.billing_state = data.region
		if (data.country !== undefined) updateData.billing_country = data.country

		if (Object.keys(updateData).length) {
			await api.Billing.Customers.update(updateData, { id: customer.id })
			api.Log(`Customer ${customer.id} updated from LS webhook`, this.prefix)
		}
	}

	private async onPaymentRefunded(_data: any, _customData: any) {
		api.Log(`Event triggered: subscription_payment_refunded`, this.prefix)
	}
	private async onPlanChanged(_data: any, _customData: any) {
		api.Log(`Event triggered: subscription_plan_changed`, this.prefix)
	}
	private async onLicenseKeyCreated(_data: any, _customData: any) {
		api.Log(`Event triggered: license_key_created`, this.prefix)
	}
	private async onLicenseKeyUpdated(_data: any, _customData: any) {
		api.Log(`Event triggered: license_key_updated`, this.prefix)
	}
	private async onAffiliateActivated(_data: any, _customData: any) {
		api.Log(`Event triggered: affiliate_activated`, this.prefix)
	}
}
