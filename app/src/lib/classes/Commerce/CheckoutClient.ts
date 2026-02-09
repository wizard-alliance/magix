export class CheckoutClient {

	async create(params: { variantId: string, planId?: number, redirectUrl?: string }) {
		return app.System.Request.post<{ id: string, url: string }>(`/billing/checkout`, { body: params })
	}
}
