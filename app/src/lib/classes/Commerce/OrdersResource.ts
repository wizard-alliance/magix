import { BaseResource } from '../Data/BaseResource'
import type { BillingOrder } from '../../types/commerce'

export class OrdersResource extends BaseResource<BillingOrder> {
	constructor() {
		super('billing/order', 'billing/orders')
	}
}
