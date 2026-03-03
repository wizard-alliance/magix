import { BaseResource } from '../Data/BaseResource'
import type { BillingInvoice } from '../../types/commerce'

export class InvoicesResource extends BaseResource<BillingInvoice> {
	constructor() {
		super('billing/invoice', 'billing/invoices')
	}

	/**
	 * Download invoice PDF via the API proxy
	 */
	downloadPdf(id: number, filename?: string) {
		return (globalThis as any).app.System.Request.download(
			`billing/invoice/pdf`,
			filename ?? `invoice-${id}.pdf`,
			{ query: { id } },
		)
	}

	/**
	 * Admin: force-regenerate an invoice PDF from the MoR
	 */
	regeneratePdf(id: number) {
		return (globalThis as any).app.System.Request.post(`billing/invoice/pdf/regenerate`, { body: { id } })
	}
}
