import { BaseResource } from '../Data/BaseResource'
import type { BillingProductFull, BillingProductFeature, BillingProductMeta, BillingProductGroup } from '../../types/commerce'

export class ProductsResource extends BaseResource<BillingProductFull> {
	constructor() {
		super('billing/product', 'billing/products')
	}

	async listFeatures(query?: Record<string, any>): Promise<BillingProductFeature[]> {
		const data = await this.request<BillingProductFeature[]>('get', 'billing/product/features', { query })
		return Array.isArray(data) ? data : []
	}

	async createFeature(body: { providerId: string, featureName: string, description?: string, sortOrder?: number }) {
		return this.request('post', 'billing/product/feature', { body: this.normalizeBody(body) })
	}

	async updateFeature(id: number, body: Record<string, any>) {
		return this.request('put', 'billing/product/feature', { query: { id }, body: this.normalizeBody(body) })
	}

	async deleteFeature(id: number) {
		return this.request('delete', 'billing/product/feature', { query: { id } })
	}

	async listGrouped(): Promise<BillingProductGroup[]> {
		const data = await this.request<BillingProductGroup[]>('get', 'billing/products/grouped')
		return Array.isArray(data) ? data : []
	}

	// Product Meta
	async listMeta(productId?: number): Promise<BillingProductMeta[]> {
		const query = productId ? { product_id: productId } : undefined
		const data = await this.request<BillingProductMeta[]>('get', 'billing/product/metas', { query })
		return Array.isArray(data) ? data : []
	}

	async setMeta(body: { productId: number, key: string, value: string | null }) {
		return this.request('post', 'billing/product/meta', { body: this.normalizeBody(body) })
	}

	async updateMeta(id: number, body: Record<string, any>) {
		return this.request('put', 'billing/product/meta', { query: { id }, body: this.normalizeBody(body) })
	}

	async deleteMeta(id: number) {
		return this.request('delete', 'billing/product/meta', { query: { id } })
	}
}
