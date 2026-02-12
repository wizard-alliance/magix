import crypto from 'crypto'

const LS_API_BASE = `https://api.lemonsqueezy.com/v1`

type LSCheckoutParams = {
	variantId: string | number
	email?: string
	name?: string
	customData?: Record<string, string | number>
	redirectUrl?: string
}

type LSWebhookEvent = {
	meta: {
		event_name: string
		custom_data?: Record<string, string>
	}
	data: {
		id: string
		type: string
		attributes: Record<string, any>
		relationships?: Record<string, any>
	}
}

export class LemonSqueezyProvider {
	private get enabled() { return api.Config(`LEMON_SQUEEZY_ENABLED`) == `true` }
	private get apiKey() { return api.Config(`LEMON_SQUEEZY_API_KEY`) }
	private get storeId() { return api.Config(`LEMON_SQUEEZY_STORE_ID`) }
	private get webhookSecret() { return api.Config(`LEMON_SQUEEZY_WEBHOOK_SECRET`) }

	private constructor() {
		if(!this.enabled) {
			api.Log(`LemonSqueezy provider is not enabled`, `LemonSqueezy`, `warning`)
		}
		if (this.enabled && !this.apiKey) {
			api.Log(`LemonSqueezy API key is missing in configuration`, `LemonSqueezy`, `error`)
			return
		}
		if (this.enabled && !this.storeId) {
			api.Log(`LemonSqueezy Store ID is missing in configuration`, `LemonSqueezy`, `error`)
			return
		}

		this.ensureProvider().then(() => this.sync())
	}

	/** Ensure a billing_payment_providers row exists for LemonSqueezy (id=1) */
	private async ensureProvider() {
		try {
			const existing = await api.Billing.PaymentProviders.get({ id: 1 })
			if (!existing) {
				await api.Billing.PaymentProviders.set({ name: `LemonSqueezy` })
				api.Log(`Created billing_payment_providers row for LemonSqueezy`, `LemonSqueezy`)
			}
		} catch (e: any) {
			api.Log(`Failed to ensure payment provider row: ${e.message}`, `LemonSqueezy`, `error`)
		}
	}
	
	private headers() {
		return {
			'Authorization': `Bearer ${this.apiKey}`,
			'Accept': 'application/vnd.api+json',
			'Content-Type': 'application/vnd.api+json',
		}
	}

	private async request<T = any>(method: string, endpoint: string, body?: object): Promise<T> {
		if (!this.enabled) throw new Error(`LemonSqueezy is not enabled`)
		const res = await fetch(`${LS_API_BASE}${endpoint}`, {
			method,
			headers: this.headers(),
			body: body ? JSON.stringify(body) : undefined,
		})
		if (!res.ok) {
			const err = await res.text()
			throw new Error(`LemonSqueezy API error: ${res.status} ${err}`)
		}
		return res.json()
	}

	// ─────────────────────────────────────────────────────────────
	// Checkout
	// ─────────────────────────────────────────────────────────────

	async createCheckout(params: LSCheckoutParams) {
		const { variantId, email, name, customData, redirectUrl } = params
		// LS requires custom data values to be strings
		const custom: Record<string, string> = {}
		if (customData) {
			for (const [key, val] of Object.entries(customData)) {
				if (val != null) custom[key] = String(val)
			}
		}
		const payload = {
			data: {
				type: 'checkouts',
				attributes: {
					checkout_data: {
						email: email || undefined,
						name: name || undefined,
						custom: Object.keys(custom).length ? custom : undefined,
					},
					product_options: {
						redirect_url: redirectUrl,
					},
				},
				relationships: {
					store: { data: { type: 'stores', id: String(this.storeId) } },
					variant: { data: { type: 'variants', id: String(variantId) } },
				},
			},
		}
		api.Log(`Creating checkout: ${JSON.stringify(payload)}`, `LemonSqueezy`)
		const result = await this.request('POST', `/checkouts`, payload)
		return {
			id: result.data.id,
			url: result.data.attributes.url,
		}
	}

	// ─────────────────────────────────────────────────────────────
	// Subscriptions
	// ─────────────────────────────────────────────────────────────

	async getSubscription(subscriptionId: string | number) {
		const result = await this.request('GET', `/subscriptions/${subscriptionId}`)
		return result.data
	}

	async cancelSubscription(subscriptionId: string | number) {
		const result = await this.request('DELETE', `/subscriptions/${subscriptionId}`)
		return result.data
	}

	async pauseSubscription(subscriptionId: string | number) {
		const payload = {
			data: {
				type: 'subscriptions',
				id: String(subscriptionId),
				attributes: { pause: { mode: 'void' } },
			},
		}
		const result = await this.request('PATCH', `/subscriptions/${subscriptionId}`, payload)
		return result.data
	}

	async resumeSubscription(subscriptionId: string | number) {
		const payload = {
			data: {
				type: 'subscriptions',
				id: String(subscriptionId),
				attributes: { pause: null },
			},
		}
		const result = await this.request('PATCH', `/subscriptions/${subscriptionId}`, payload)
		return result.data
	}

	// ─────────────────────────────────────────────────────────────
	// Customer Portal
	// ─────────────────────────────────────────────────────────────

	async getCustomerPortalUrl(customerId: string | number) {
		const result = await this.request('GET', `/customers/${customerId}`)
		return result.data.attributes.urls?.customer_portal ?? null
	}

	// ─────────────────────────────────────────────────────────────
	// Customers
	// ─────────────────────────────────────────────────────────────

	async updateCustomer(customerId: string | number, attrs: Record<string, any>) {
		const payload = {
			data: {
				type: `customers`,
				id: String(customerId),
				attributes: attrs,
			},
		}
		const result = await this.request(`PATCH`, `/customers/${customerId}`, payload)
		return result.data
	}

	// ─────────────────────────────────────────────────────────────
	// Store Data (for admin/sync)
	// ─────────────────────────────────────────────────────────────

	async getStore() {
		const result = await this.request('GET', `/stores/${this.storeId}`)
		return result.data
	}

	async getProducts() {
		const result = await this.request('GET', `/products`)
		return result.data
	}

	async getProduct(productId: string | number) {
		const result = await this.request('GET', `/products/${productId}`)
		return result.data
	}

	async getVariants(productId?: string | number) {
		const filter = productId ? `?filter[product_id]=${productId}` : ``
		const result = await this.request('GET', `/variants${filter}`)
		return result.data
	}

	async getVariant(variantId: string | number) {
		const result = await this.request('GET', `/variants/${variantId}`)
		return result.data
	}

	async getSubscriptions() {
		const result = await this.request('GET', `/subscriptions`)
		return result.data
	}

	async getOrders() {
		const result = await this.request('GET', `/orders`)
		return result.data
	}

	async getCustomers() {
		const result = await this.request('GET', `/customers`)
		return result.data
	}

	async getCustomer(customerId: string | number) {
		const result = await this.request('GET', `/customers/${customerId}`)
		return result.data
	}

	isEnabled() {
		return this.enabled
	}

	// ─────────────────────────────────────────────────────────────
	// Paginated Fetch (for historical sync)
	// ─────────────────────────────────────────────────────────────

	private async fetchAll(endpoint: string): Promise<any[]> {
		const all: any[] = []
		let page = 1
		while (true) {
			const sep = endpoint.includes(`?`) ? `&` : `?`
			const result = await this.request<any>(`GET`, `${endpoint}${sep}page[number]=${page}&page[size]=50`)
			if (result.data) all.push(...result.data)
			const last = result.meta?.page?.lastPage ?? 1
			if (page >= last) break
			page++
		}
		return all
	}

	// ─────────────────────────────────────────────────────────────
	// Sync
	// ─────────────────────────────────────────────────────────────

	async sync() {
		const results = {
			customers: await this.syncCustomers(),
			products: await this.syncProducts(),
			orders: await this.syncOrders(),
			subscriptions: await this.syncSubscriptions(),
			invoices: await this.syncInvoices(),
		}
		return results
	}

	async syncProducts() {
		const stats = { created: 0, updated: 0, errors: [] as string[] }

		try {
			const products = await this.fetchAll(`/products`)
			const variants = await this.fetchAll(`/variants`)

			const productMap = new Map<string, any>()
			for (const p of products) productMap.set(p.id, p)

			for (const variant of variants) {
				try {
					const product = productMap.get(String(variant.attributes.product_id))
					const variantId = String(variant.id)
					const existing = await api.Billing.Products.get({ provider_variant_id: variantId })

					let productType = `one_time`
					if (product?.attributes?.pay_what_you_want) {
						productType = `pwyw`
					} else if (variant.attributes.is_subscription) {
						productType = `subscription`
					} else if (variant.attributes.price === 0) {
						productType = `lead_magnet`
					}

					const productData = {
						name: product?.attributes?.name || variant.attributes.name,
						type: productType,
						provider_id: String(variant.attributes.product_id),
						provider_variant_id: variantId,
						price: variant.attributes.price,
						currency: variant.attributes.currency || `USD`,
						interval: variant.attributes.interval || ``,
						interval_count: variant.attributes.interval_count || 1,
						trial_days: variant.attributes.trial_interval === `day` ? (variant.attributes.trial_interval_count || 0) : 0,
						description: variant.attributes.description || product?.attributes?.description || null,
						is_active: product?.attributes?.status === `published` ? 1 : 0,
					}

					if (existing) {
						await api.Billing.Products.update(productData, { id: existing.id })
						stats.updated++
					} else {
						await api.Billing.Products.set(productData)
						stats.created++
					}
				} catch (e: any) {
					stats.errors.push(`Variant ${variant.id}: ${e.message}`)
				}
			}
		} catch (e: any) {
			stats.errors.push(`Sync failed: ${e.message}`)
		}

		return stats
	}

	async syncCustomers() {
		const stats = { created: 0, updated: 0, errors: [] as string[] }
		try {
			const lsCustomers = await this.fetchAll(`/customers`)
			for (const c of lsCustomers) {
				try {
					const a = c.attributes
					const lsId = String(c.id)
					const existing = await api.Billing.Customers.getMany({ provider_customer_id: lsId })
					const match = existing[0] ?? null

					const data: Record<string, any> = {
						billing_name: a.name || null,
						billing_email: a.email || null,
						billing_city: a.city || null,
						billing_state: a.region || null,
						billing_country: a.country || null,
						provider_customer_id: lsId,
					}

					if (match) {
						await api.Billing.Customers.update(data, { id: match.id })
						stats.updated++
					} else {
						// Try email match to backfill provider_customer_id
						const emailMatch = a.email ? (await api.Billing.Customers.getMany({ billing_email: a.email }))[0] : null
						if (emailMatch) {
							await api.Billing.Customers.update(data, { id: emailMatch.id })
							stats.updated++
						} else {
							await api.Billing.Customers.set({ ...data, is_guest: 1 } as any)
							stats.created++
						}
					}
				} catch (e: any) {
					stats.errors.push(`Customer ${c.id}: ${e.message}`)
				}
			}
		} catch (e: any) {
			stats.errors.push(`Sync failed: ${e.message}`)
		}
		return stats
	}

	async syncOrders() {
		const stats = { created: 0, updated: 0, errors: [] as string[] }
		try {
			const lsOrders = await this.fetchAll(`/orders`)
			for (const o of lsOrders) {
				try {
					const a = o.attributes
					const providerOrderId = String(o.id)

					// Resolve customer
					const lsCustId = String(a.customer_id)
					const customers = await api.Billing.Customers.getMany({ provider_customer_id: lsCustId })
					let customer = customers[0] ?? null
					if (!customer && a.user_email) {
						const emailMatch = await api.Billing.Customers.getMany({ billing_email: a.user_email })
						customer = emailMatch[0] ?? null
					}
					if (!customer) {
						stats.errors.push(`Order ${o.id}: no matching customer (LS customer ${lsCustId})`)
						continue
					}

					// Check existing
					const existing = await api.Billing.Orders.getMany({ provider_order_id: providerOrderId })
					const match = existing[0] ?? null

					const orderData: Record<string, any> = {
						customer_id: customer.id,
						type: `purchase`,
						provider_id: 1,
						provider_order_id: providerOrderId,
						amount: a.total ?? 0,
						currency: a.currency || `USD`,
						status: a.status === `paid` ? `paid` : a.status === `refunded` ? `refunded` : `pending`,
						paid_at: a.status === `paid` ? (a.created_at ? new Date(a.created_at).toISOString().slice(0, 19).replace(`T`, ` `) : null) : null,
					}

					if (match) {
						await api.Billing.Orders.update({ status: orderData.status, amount: orderData.amount }, { id: match.id })
						stats.updated++
					} else {
						const result = await api.Billing.Orders.set(orderData)
						stats.created++
						// Auto-create invoice
						const orderId = result?.id
						if (orderId) {
							try {
								await api.Billing.Invoices.set({
									order_id: orderId,
									customer_id: customer.id,
									billing_info_snapshot: JSON.stringify(customer.billingAddress ?? {}),
									billing_order_snapshot: JSON.stringify({ amount: orderData.amount, currency: orderData.currency, status: orderData.status }),
									pdf_url: a.urls?.receipt ?? null,
								})
							} catch { /* invoice creation is best-effort */ }
						}
					}
				} catch (e: any) {
					stats.errors.push(`Order ${o.id}: ${e.message}`)
				}
			}
		} catch (e: any) {
			stats.errors.push(`Sync failed: ${e.message}`)
		}
		return stats
	}

	async syncSubscriptions() {
		const stats = { created: 0, updated: 0, errors: [] as string[] }
		try {
			const lsSubs = await this.fetchAll(`/subscriptions`)
			for (const s of lsSubs) {
				try {
					const a = s.attributes
					const providerSubId = String(s.id)

					// Resolve customer
					const lsCustId = String(a.customer_id)
					const customers = await api.Billing.Customers.getMany({ provider_customer_id: lsCustId })
					let customer = customers[0] ?? null
					if (!customer && a.user_email) {
						const emailMatch = await api.Billing.Customers.getMany({ billing_email: a.user_email })
						customer = emailMatch[0] ?? null
					}
					if (!customer) {
						stats.errors.push(`Subscription ${s.id}: no matching customer`)
						continue
					}

					// Resolve plan by variant
					let planId: number | undefined
					if (a.variant_id) {
						const product = await api.Billing.Products.get({ provider_variant_id: String(a.variant_id) })
						if (product) planId = product.id
					}

					const toDate = (iso: string | null) => iso ? new Date(iso).toISOString().slice(0, 19).replace(`T`, ` `) : undefined

					const existing = await api.Billing.Subscriptions.get({ provider_subscription_id: providerSubId })

					const subData: Record<string, any> = {
						customer_id: customer.id,
						plan_id: planId,
						provider_subscription_id: providerSubId,
						status: a.status || `active`,
						current_period_start: toDate(a.created_at),
						current_period_end: toDate(a.renews_at || a.ends_at),
						cancel_at_period_end: a.cancelled ? 1 : 0,
						canceled_at: toDate(a.ends_at),
					}

					if (existing) {
						await api.Billing.Subscriptions.update({
							status: subData.status,
							current_period_end: subData.current_period_end,
							cancel_at_period_end: subData.cancel_at_period_end,
						}, { id: existing.id })
						stats.updated++
					} else {
						await api.Billing.Subscriptions.set(subData)
						stats.created++
					}
				} catch (e: any) {
					stats.errors.push(`Subscription ${s.id}: ${e.message}`)
				}
			}
		} catch (e: any) {
			stats.errors.push(`Sync failed: ${e.message}`)
		}
		return stats
	}

	async syncInvoices() {
		const stats = { created: 0, updated: 0, errors: [] as string[] }
		try {
			const lsInvoices = await this.fetchAll(`/subscription-invoices`)
			for (const inv of lsInvoices) {
				try {
					const a = inv.attributes
					const providerSubId = String(a.subscription_id)

					// Resolve subscription → customer
					const sub = await api.Billing.Subscriptions.get({ provider_subscription_id: providerSubId })
					if (!sub) {
						stats.errors.push(`Invoice ${inv.id}: no matching subscription (LS sub ${providerSubId})`)
						continue
					}

					// Find matching order (by subscription_id)
					const orders = await api.Billing.Orders.getMany({ subscription_id: sub.id })
					const orderId = orders[0]?.id ?? null
					if (!orderId) continue // no order to attach to

					// Check if invoice exists for this order already
					const existingInvoices = await api.Billing.Invoices.getMany({ order_id: orderId })
					if (existingInvoices.length > 0) {
						stats.updated++
						continue
					}

					await api.Billing.Invoices.set({
						order_id: orderId,
						customer_id: sub.customerId,
						billing_info_snapshot: JSON.stringify({}),
						billing_order_snapshot: JSON.stringify({ amount: a.total ?? 0, currency: a.currency || `USD`, status: a.status }),
						pdf_url: a.urls?.invoice_url ?? null,
					})
					stats.created++
				} catch (e: any) {
					stats.errors.push(`Invoice ${inv.id}: ${e.message}`)
				}
			}
		} catch (e: any) {
			stats.errors.push(`Sync failed: ${e.message}`)
		}
		return stats
	}

	// ─────────────────────────────────────────────────────────────
	// Webhooks
	// ─────────────────────────────────────────────────────────────

	verifyWebhookSignature(payload: string, signature: string): boolean {
		const hmac = crypto.createHmac('sha256', this.webhookSecret)
		const digest = hmac.update(payload).digest('hex')
		return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
	}

	parseWebhook(payload: string): LSWebhookEvent {
		return JSON.parse(payload)
	}

	async handleWebhook(rawBody: string, signature: string) {
		if (!this.verifyWebhookSignature(rawBody, signature)) {
			throw new Error(`Invalid webhook signature`)
		}

		const event = this.parseWebhook(rawBody)
		const eventName = event.meta.event_name
		const data = { id: event.data.id, ...event.data.attributes }
		const customData = event.meta.custom_data ?? {}

		// TODO: Broadcast internal event for other systems to react
		// api.Events.emit(`billing:ls:${eventName}`, { event, data, customData })

		return { eventName, data, customData }
	}
}
