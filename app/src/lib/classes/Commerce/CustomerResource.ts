import { BaseResource } from '../Data/BaseResource'
import type { BillingCustomerFull, BillingFormData } from '../../types/commerce'

export class CustomerResource extends BaseResource<BillingCustomerFull> {
	constructor() {
		super('billing/customer', 'billing/customers')
	}

	async saveMe(data: BillingFormData) {
		return app.System.Request.put<BillingCustomerFull>(`/billing/customer/me`, { body: data })
	}

	toForm(customer: BillingCustomerFull | null): BillingFormData {
		if (!customer) return {}
		return {
			billingName: customer.billingName ?? ``,
			billingPhone: customer.billingPhone ?? ``,
			addressLine1: customer.billingAddress?.line1 ?? ``,
			addressLine2: customer.billingAddress?.line2 ?? ``,
			city: customer.billingAddress?.city ?? ``,
			state: customer.billingAddress?.state ?? ``,
			zip: customer.billingAddress?.zip ?? ``,
			country: customer.billingAddress?.country ?? ``,
			vatId: customer.vatId ?? ``,
		}
	}
}
