import { BaseResource } from '../Data/BaseResource'
import type { BillingProductFull, BillingProductFeature } from '../../types/commerce'

export class ProductsResource extends BaseResource<BillingProductFull> {
	constructor() {
		super('billing/product', 'billing/products')
	}

	async listFeatures(productId?: number): Promise<BillingProductFeature[]> {
		const query = productId ? { product_id: productId } : undefined
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
