import { BaseResource } from '../Data/BaseResource'
import type { BillingInvoice } from '../../types/commerce'

export class InvoicesResource extends BaseResource<BillingInvoice> {
	constructor() {
		super('billing/invoice', 'billing/invoices')
	}
}
