import { BaseResource } from '../Data/BaseResource'
import type { BillingProductFull, BillingProductFeature } from '../../types/commerce'

export class ProductsResource extends BaseResource<BillingProductFull> {
	constructor() {
		super('billing/product', 'billing/products')
	}

	async listFeatures(queryOrProductId?: number | Record<string, any>): Promise<BillingProductFeature[]> {
		const query = typeof queryOrProductId === `number`
			? { product_id: queryOrProductId }
			: queryOrProductId ?? undefined
		const data = await this.request<BillingProductFeature[]>('get', 'billing/product/features', { query })
		return Array.isArray(data) ? data : []
	}

	async createFeature(body: { productId: number, featureName: string, description?: string }) {
		return this.request('post', 'billing/product/feature', { body: this.normalizeBody(body) })
	}

	async updateFeature(id: number, body: Record<string, any>) {
		return this.request('put', 'billing/product/feature', { query: { id }, body: this.normalizeBody(body) })
	}

	async deleteFeature(id: number) {
		return this.request('delete', 'billing/product/feature', { query: { id } })
	}
}
