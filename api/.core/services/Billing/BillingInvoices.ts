import type { BillingInvoiceDBRow } from "../../schema/Database.js"
import type { BillingInvoice } from "../../schema/DomainShapes.js"

const parseJson = (val: string | null) => val ? JSON.parse(val) : null

const toShape = (row: BillingInvoiceDBRow): BillingInvoice => ({
	id: row.id!,
	orderId: row.order_id,
	customerId: row.customer_id,
	billingInfoSnapshot: parseJson(row.billing_info_snapshot),
	billingOrderSnapshot: parseJson(row.billing_order_snapshot),
	snapshotVersion: row.snapshot_version,
	pdfUrl: row.pdf_url,
	created: row.created,
})

export class BillingInvoices {
	private db = api.DB.connection

	async get(params: Partial<BillingInvoiceDBRow>): Promise<BillingInvoice | null> {
		let query = this.db.selectFrom("billing_invoices").selectAll()
		query = api.Utils.applyWhere(query, params)
		const row = await query.executeTakeFirst()
		return row ? toShape(row) : null
	}

	async getMany(params: Partial<BillingInvoiceDBRow> = {}, options = {}): Promise<BillingInvoice[]> {
		let query = this.db.selectFrom("billing_invoices").selectAll()
		query = api.Utils.applyWhere(query, params)
		query = api.Utils.applyOptions(query, options)
		const rows = await query.execute()
		return rows.map(toShape)
	}

	async set(params: Partial<BillingInvoiceDBRow>) {
		const result = await this.db.insertInto("billing_invoices").values(params as any).executeTakeFirst()
		return { id: result.insertId ? Number(result.insertId) : null }
	}

	async update(data: Partial<BillingInvoiceDBRow>, where: Partial<BillingInvoiceDBRow>) {
		let query = this.db.updateTable("billing_invoices").set(data)
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numUpdatedRows: Number(result.numUpdatedRows) }
	}

	async delete(where: Partial<BillingInvoiceDBRow>) {
		let query = this.db.deleteFrom("billing_invoices")
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numDeletedRows: Number(result.numDeletedRows) }
	}
}
