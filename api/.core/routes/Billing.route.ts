import type { Request } from "express"

export class BillingRoute {
	private readonly route = "billing"

	public routes = async () => {
		const opts = { protected: true, perms: ["user"] }
		const adminOpts = { protected: true, perms: ["administrator"] }

		// Customers
		api.Router.set("GET", `${this.route}/customer`, this.getCustomer, opts)
		api.Router.set("GET", `${this.route}/customers`, this.getCustomers, adminOpts)
		api.Router.set("POST", `${this.route}/customer`, this.createCustomer, adminOpts)
		api.Router.set("PUT", `${this.route}/customer`, this.updateCustomer, adminOpts)
		api.Router.set("DELETE", `${this.route}/customer`, this.deleteCustomer, adminOpts)
		api.Router.set("GET", `${this.route}/customer/portal`, this.getCustomerPortal, opts)

		// Plans
		api.Router.set("GET", `${this.route}/plan`, this.getPlan)
		api.Router.set("GET", `${this.route}/products`, this.getProducts)
		api.Router.set("POST", `${this.route}/product`, this.createProduct, adminOpts)
		api.Router.set("PUT", `${this.route}/product`, this.updateProduct, adminOpts)
		api.Router.set("DELETE", `${this.route}/product`, this.deleteProduct, adminOpts)

		// Product Features
		api.Router.set("GET", `${this.route}/product/feature`, this.getProductFeature, adminOpts)
		api.Router.set("GET", `${this.route}/product/features`, this.getProductFeatures)
		api.Router.set("POST", `${this.route}/product/feature`, this.createProductFeature, adminOpts)
		api.Router.set("PUT", `${this.route}/product/feature`, this.updateProductFeature, adminOpts)
		api.Router.set("DELETE", `${this.route}/product/feature`, this.deleteProductFeature, adminOpts)

		// Subscriptions
		api.Router.set("GET", `${this.route}/subscription`, this.getSubscription, opts)
		api.Router.set("GET", `${this.route}/subscriptions`, this.getSubscriptions, adminOpts)
		api.Router.set("POST", `${this.route}/subscription/cancel`, this.cancelSubscription, opts)
		api.Router.set("POST", `${this.route}/subscription/pause`, this.pauseSubscription, opts)
		api.Router.set("POST", `${this.route}/subscription/resume`, this.resumeSubscription, opts)

		// Checkout
		api.Router.set("POST", `${this.route}/checkout`, this.createCheckout, opts)

		// Orders
		api.Router.set("GET", `${this.route}/order`, this.getOrder, opts)
		api.Router.set("GET", `${this.route}/orders`, this.getOrders, adminOpts)

		// Invoices
		api.Router.set("GET", `${this.route}/invoice`, this.getInvoice, opts)
		api.Router.set("GET", `${this.route}/invoices`, this.getInvoices, adminOpts)

		// LemonSqueezy Admin (direct LS API access)
		api.Router.set("GET", `${this.route}/ls/status`, this.lsStatus, adminOpts)
		api.Router.set("GET", `${this.route}/ls/store`, this.lsGetStore, adminOpts)
		api.Router.set("GET", `${this.route}/ls/products`, this.lsGetProducts, adminOpts)
		api.Router.set("GET", `${this.route}/ls/product`, this.lsGetProduct, adminOpts)
		api.Router.set("GET", `${this.route}/ls/variants`, this.lsGetVariants, adminOpts)
		api.Router.set("GET", `${this.route}/ls/variant`, this.lsGetVariant, adminOpts)
		api.Router.set("GET", `${this.route}/ls/subscriptions`, this.lsGetSubscriptions, adminOpts)
		api.Router.set("GET", `${this.route}/ls/subscription`, this.lsGetSubscription, adminOpts)
		api.Router.set("GET", `${this.route}/ls/orders`, this.lsGetOrders, adminOpts)
		api.Router.set("GET", `${this.route}/ls/customers`, this.lsGetCustomers, adminOpts)
		api.Router.set("GET", `${this.route}/ls/customer`, this.lsGetCustomer, adminOpts)
		api.Router.set("POST", `${this.route}/ls/sync`, this.lsSync, adminOpts)
		api.Router.set("POST", `${this.route}/ls/sync/products`, this.lsSyncProducts, adminOpts)

		// Webhook (public for MoR)
		api.Router.set("POST", `${this.route}/webhook`, this.webhook)
	}

	// Customers
	getCustomer = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Customer ID required" }
		return await api.Billing.Customers.get({ id }) ?? { code: 404, error: "Customer not found" }
	}

	getCustomers = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Customers.getMany({}, { limit: Number(p.limit) || 100, offset: Number(p.offset) || 0 })
	}

	createCustomer = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Customers.set(p)
	}

	updateCustomer = async ($: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Customer ID required" }
		const { id: _id, ...data } = p
		return await api.Billing.Customers.update(data, { id })
	}

	deleteCustomer = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Customer ID required" }
		return await api.Billing.Customers.delete({ id })
	}

	// Products
	getProduct = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Product ID required" }
		return await api.Billing.Products.get({ id }) ?? { code: 404, error: "Product not found" }
	}

	getProducts = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Products.getMany({ is_active: 1 }, { limit: Number(p.limit) || 100, offset: Number(p.offset) || 0 })
	}

	createProduct = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Products.set(p)
	}

	updateProduct = async ($: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Product ID required" }
		const { id: _id, ...data } = p
		return await api.Billing.Products.update(data, { id })
	}

	deleteProduct = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Product ID required" }
		return await api.Billing.Products.delete({ id })
	}

	// Product Features
	getProductFeature = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Feature ID required" }
		return await api.Billing.Products.getFeature({ id }) ?? { code: 404, error: "Feature not found" }
	}

	getProductFeatures = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const product_id = Number(p.product_id)
		return await api.Billing.Products.getFeatures(product_id ? { product_id } : {})
	}

	createProductFeature = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Products.setFeature(p)
	}

	updateProductFeature = async ($: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Feature ID required" }
		const { id: _id, ...data } = p
		return await api.Billing.Products.updateFeature(data, { id })
	}

	deleteProductFeature = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Feature ID required" }
		return await api.Billing.Products.deleteFeature({ id })
	}

	// Subscriptions
	getSubscription = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Subscription ID required" }
		return await api.Billing.Subscriptions.get({ id }) ?? { code: 404, error: "Subscription not found" }
	}

	getSubscriptions = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Subscriptions.getMany({}, { limit: Number(p.limit) || 100, offset: Number(p.offset) || 0 })
	}

	cancelSubscription = async ($: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Subscription ID required" }
		const sub = await api.Billing.Subscriptions.get({ id })
		if (!sub) return { code: 404, error: "Subscription not found" }
		if (!sub.providerSubscriptionId) return { code: 400, error: "No provider subscription linked" }
		try {
			await api.Billing.Providers.LS.cancelSubscription(sub.providerSubscriptionId)
			return { success: true }
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	pauseSubscription = async ($: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Subscription ID required" }
		const sub = await api.Billing.Subscriptions.get({ id })
		if (!sub) return { code: 404, error: "Subscription not found" }
		if (!sub.providerSubscriptionId) return { code: 400, error: "No provider subscription linked" }
		try {
			await api.Billing.Providers.LS.pauseSubscription(sub.providerSubscriptionId)
			return { success: true }
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	resumeSubscription = async ($: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Subscription ID required" }
		const sub = await api.Billing.Subscriptions.get({ id })
		if (!sub) return { code: 404, error: "Subscription not found" }
		if (!sub.providerSubscriptionId) return { code: 400, error: "No provider subscription linked" }
		try {
			await api.Billing.Providers.LS.resumeSubscription(sub.providerSubscriptionId)
			return { success: true }
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	// Checkout
	createCheckout = async ($: any, req: Request) => {
		const p = api.getParams(req)
		const variantId = p.variant_id || p.variantId
		if (!variantId) return { code: 422, error: "Variant ID required" }
		try {
			const result = await api.Billing.Providers.LS.createCheckout({
				variantId,
				email: p.email || $.user?.email,
				name: p.name || $.user?.name,
				customData: { user_id: $.user?.id, plan_id: p.plan_id },
				redirectUrl: p.redirect_url,
			})
			return result
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	// Customer Portal
	getCustomerPortal = async ($: any, req: Request) => {
		const customer = await api.Billing.Customers.get({ user_id: $.user?.id })
		if (!customer) return { code: 404, error: "No billing customer found" }
		// Need LS customer ID - would need to store this
		// For now, return error indicating this needs setup
		return { code: 501, error: "Customer portal requires LS customer ID mapping" }
	}

	// Orders
	getOrder = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Order ID required" }
		return await api.Billing.Orders.get({ id }) ?? { code: 404, error: "Order not found" }
	}

	getOrders = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Orders.getMany({}, { limit: Number(p.limit) || 100, offset: Number(p.offset) || 0 })
	}

	// Invoices
	getInvoice = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Invoice ID required" }
		return await api.Billing.Invoices.get({ id }) ?? { code: 404, error: "Invoice not found" }
	}

	getInvoices = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Invoices.getMany({}, { limit: Number(p.limit) || 100, offset: Number(p.offset) || 0 })
	}

	// Webhook for LemonSqueezy
	webhook = async (_: any, req: Request) => {
		const signature = req.headers[`x-signature`] as string
		const rawBody = (req as any).rawBody as string

		// In production, verify signature
		if (signature && rawBody) {
			try {
				const { eventName, data, customData } = await api.Billing.Providers.LS.handleWebhook(rawBody, signature)
				return await api.Billing.Events.process({ event: eventName as any, data, customData })
			} catch (e: any) {
				return { code: 401, error: e.message }
			}
		}

		// Dev/test mode: accept unverified webhooks
		const p = api.getParams(req)
		return await api.Billing.Events.process({
			event: p.meta?.event_name,
			data: p.data?.attributes ?? p.data ?? {},
			customData: p.meta?.custom_data ?? {},
		})
	}

	// ─────────────────────────────────────────────────────────────
	// LemonSqueezy Admin Routes
	// ─────────────────────────────────────────────────────────────

	lsStatus = async () => {
		return { enabled: api.Billing.Providers.LS.isEnabled() }
	}

	lsGetStore = async () => {
		try {
			return await api.Billing.Providers.LS.getStore()
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	lsGetProducts = async () => {
		try {
			return await api.Billing.Providers.LS.getProducts()
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	lsGetProduct = async (_: any, req: Request) => {
		const p = api.getParams(req)
		if (!p.id) return { code: 422, error: "Product ID required" }
		try {
			return await api.Billing.Providers.LS.getProduct(p.id)
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	lsGetVariants = async (_: any, req: Request) => {
		const p = api.getParams(req)
		try {
			return await api.Billing.Providers.LS.getVariants(p.product_id)
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	lsGetVariant = async (_: any, req: Request) => {
		const p = api.getParams(req)
		if (!p.id) return { code: 422, error: "Variant ID required" }
		try {
			return await api.Billing.Providers.LS.getVariant(p.id)
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	lsGetSubscriptions = async () => {
		try {
			return await api.Billing.Providers.LS.getSubscriptions()
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	lsGetSubscription = async (_: any, req: Request) => {
		const p = api.getParams(req)
		if (!p.id) return { code: 422, error: "Subscription ID required" }
		try {
			return await api.Billing.Providers.LS.getSubscription(p.id)
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	lsGetOrders = async () => {
		try {
			return await api.Billing.Providers.LS.getOrders()
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	lsGetCustomers = async () => {
		try {
			return await api.Billing.Providers.LS.getCustomers()
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	lsGetCustomer = async (_: any, req: Request) => {
		const p = api.getParams(req)
		if (!p.id) return { code: 422, error: "Customer ID required" }
		try {
			return await api.Billing.Providers.LS.getCustomer(p.id)
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	lsSync = async () => {
		try {
			return await api.Billing.Providers.LS.sync()
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}

	lsSyncProducts = async () => {
		try {
			return await api.Billing.Providers.LS.syncProducts()
		} catch (e: any) {
			return { code: 500, error: e.message }
		}
	}
}
