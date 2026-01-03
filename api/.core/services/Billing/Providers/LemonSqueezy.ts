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

		this.sync()
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
						email,
						name,
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
	// Store Data (for admin/sync)
	// ─────────────────────────────────────────────────────────────

	async getStore() {
		const result = await this.request('GET', `/stores/${this.storeId}`)
		return result.data
	}

	async getProducts() {
		// Products are scoped to your store via API key, no filter needed
		const result = await this.request('GET', `/products`)
		return result.data
	}

	async getProduct(productId: string | number) {
		const result = await this.request('GET', `/products/${productId}`)
		return result.data
	}

	async getVariants(productId?: string | number) {
		// Variants can be filtered by product_id, otherwise returns all for your store
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
	// Sync
	// ─────────────────────────────────────────────────────────────

	async sync() {
		const results = {
			products: await this.syncProducts(),
		}
		return results
	}

	async syncProducts() {
		const stats = { created: 0, updated: 0, errors: [] as string[] }

		try {
			const products = await this.getProducts()
			const variants = await this.getVariants()

			// Build product lookup
			const productMap = new Map<string, any>()
			for (const p of products) {
				productMap.set(p.id, p)
			}

			for (const variant of variants) {
				try {
					const product = productMap.get(String(variant.attributes.product_id))
					const variantId = String(variant.id)

					// Check if product exists
					const existing = await api.Billing.Products.get({ provider_variant_id: variantId })

					// Determine type from LS fields
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
						is_active: variant.attributes.status === `published` ? 1 : 0,
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
