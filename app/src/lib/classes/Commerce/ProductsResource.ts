import { BaseResource } from '../Data/BaseResource'
import type { BillingProductFull } from '../../types/commerce'

export class ProductsResource extends BaseResource<BillingProductFull> {
	constructor() {
		super('billing/product', 'billing/products')
	}
}
