export class LSAdminClient {

	status() {
		return app.System.Request.get<{ enabled: boolean }>(`/billing/ls/status`)
	}

	getStore() {
		return app.System.Request.get<any>(`/billing/ls/store`)
	}

	getProducts() {
		return app.System.Request.get<any>(`/billing/ls/products`)
	}

	getProduct(id: string) {
		return app.System.Request.get<any>(`/billing/ls/product`, { query: { id } })
	}

	getVariants(productId?: string) {
		const query = productId ? { product_id: productId } : undefined
		return app.System.Request.get<any>(`/billing/ls/variants`, { query })
	}

	getVariant(id: string) {
		return app.System.Request.get<any>(`/billing/ls/variant`, { query: { id } })
	}

	getSubscriptions() {
		return app.System.Request.get<any>(`/billing/ls/subscriptions`)
	}

	getSubscription(id: string) {
		return app.System.Request.get<any>(`/billing/ls/subscription`, { query: { id } })
	}

	getOrders() {
		return app.System.Request.get<any>(`/billing/ls/orders`)
	}

	getCustomers() {
		return app.System.Request.get<any>(`/billing/ls/customers`)
	}

	getCustomer(id: string) {
		return app.System.Request.get<any>(`/billing/ls/customer`, { query: { id } })
	}

	sync() {
		return app.System.Request.post<any>(`/billing/ls/sync`)
	}

	syncProducts() {
		return app.System.Request.post<any>(`/billing/ls/sync/products`)
	}

	syncCustomers() {
		return app.System.Request.post<any>(`/billing/ls/sync/customers`)
	}

	syncOrders() {
		return app.System.Request.post<any>(`/billing/ls/sync/orders`)
	}

	syncSubscriptions() {
		return app.System.Request.post<any>(`/billing/ls/sync/subscriptions`)
	}

	syncInvoices() {
		return app.System.Request.post<any>(`/billing/ls/sync/invoices`)
	}
}
