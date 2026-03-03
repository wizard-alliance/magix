import { writeFile, mkdir, access } from 'node:fs/promises'
import path from 'node:path'
import type { BillingInvoiceDBRow } from "../../schema/Database.js"
import type { BillingInvoice } from "../../schema/DomainShapes.js"

// Snapshot version history:
// 1.0.0 — initial schema (billing_customers_snapshot + billing_order_snapshot)

const INVOICE_CACHE_DIR = path.join(process.cwd(), `data`, `invoices`)

const parseJson = (val: string | null) => {
	if (!val) return null
	try { return JSON.parse(val) } catch { return null }
}

const toShape = (row: BillingInvoiceDBRow): BillingInvoice => ({
	id: row.id!,
	orderId: row.order_id,
	customerId: row.customer_id,
	billingCustomersSnapshot: parseJson(row.billing_customers_snapshot),
	billingOrderSnapshot: parseJson(row.billing_order_snapshot),
	snapshotVersion: row.snapshot_version,
	pdfUrl: row.pdf_url,
	created: row.created,
})

export class BillingInvoices {
	private db = api.DB.connection

	/** Fetch a single invoice */
	async get(params: Partial<BillingInvoiceDBRow>): Promise<BillingInvoice | null> {
		let query = this.db.selectFrom("billing_invoices").selectAll()
		query = api.Utils.applyWhere(query, params)
		const row = await query.executeTakeFirst()
		if (!row) return null
		return toShape(row)
	}

	/**
	 * Get or generate + cache the invoice PDF locally.
	 * Returns the absolute file path on disk.
	 */
	async getOrCachePdf(invoice: BillingInvoice, force = false): Promise<string> {
		// Cache hit — local path exists on disk (skip when force-regenerating)
		if (!force && invoice.pdfUrl && !invoice.pdfUrl.startsWith(`http`)) {
			const abs = path.isAbsolute(invoice.pdfUrl) ? invoice.pdfUrl : path.join(process.cwd(), invoice.pdfUrl)
			try {
				await access(abs)
				return abs
			} catch { /* file gone — regenerate */ }
		}

		// Look up order for providerOrderId
		const order = await api.Billing.Orders.get({ id: invoice.orderId })
		if (!order?.providerOrderId) throw new Error(`No provider order ID for invoice ${invoice.id}`)

		// Build billing params from snapshot, falling back to live customer record
		const snap = invoice.billingCustomersSnapshot ?? {}
		// Use lightweight DB query instead of full customer load to avoid circular fetch
		const custRow = await this.db.selectFrom(`billing_customers`).selectAll().where(`id`, `=`, invoice.customerId).executeTakeFirst()

		const addr = custRow ? {
			line1: custRow.billing_address_line1,
			line2: custRow.billing_address_line2,
			city: custRow.billing_city,
			state: custRow.billing_state,
			zip: custRow.billing_zip,
			country: custRow.billing_country,
		} : {}

		const name = custRow?.billing_name || custRow?.billing_email || `Customer`
		const address = [snap.line1 || addr.line1, snap.line2 || addr.line2].filter(Boolean).join(`, `)
		const city = snap.city || addr.city
		const state = snap.state || addr.state
		const zip = snap.zip || addr.zip
		const country = snap.country || addr.country || `GB`

		const params: Record<string, string> = {
			name,
			address: address || `-`,
			city: city || `-`,
			zip_code: zip || `-`,
			country,
		}
		if (state) params.state = state

		// Call LS generate-invoice → signed temporary PDF URL
		const downloadUrl = await api.Billing.Providers.LS.generateInvoice(order.providerOrderId, params as any)

		// Fetch the actual PDF binary
		const pdfRes = await fetch(downloadUrl)
		if (!pdfRes.ok) throw new Error(`Failed to download generated PDF: ${pdfRes.status}`)
		const buffer = Buffer.from(await pdfRes.arrayBuffer())

		// Ensure cache dir exists & write file
		await mkdir(INVOICE_CACHE_DIR, { recursive: true })
		const filename = `invoice-${invoice.id}.pdf`
		const absPath = path.join(INVOICE_CACHE_DIR, filename)
		await writeFile(absPath, buffer)

		// Store relative path in DB so it survives cwd changes
		const relPath = path.relative(process.cwd(), absPath).replace(/\\/g, `/`)
		await this.update({ pdf_url: relPath }, { id: invoice.id })

		return absPath
	}

	async getMany(params: Partial<BillingInvoiceDBRow> = {}, options: Record<string, any> = {}): Promise<(BillingInvoice & { customerName?: string; customerEmail?: string })[]> {
		let query = this.db
			.selectFrom("billing_invoices")
			.selectAll("billing_invoices")
			.leftJoin("billing_customers", "billing_customers.id", "billing_invoices.customer_id")
			.select([
				"billing_customers.billing_name as customer_name",
				"billing_customers.billing_email as customer_email",
			])

		if ((options as any).search) {
			const term = `%${(options as any).search}%`
			query = query.where((eb: any) =>
				eb.or([
					eb("billing_customers.billing_name", "like", term),
					eb("billing_customers.billing_email", "like", term),
				])
			)
		}

		const qualified = Object.fromEntries(
			Object.entries(params).map(([k, v]) => [`billing_invoices.${k}`, v])
		)
		query = api.Utils.applyWhere(query, qualified)
		query = api.Utils.applyOptions(query, options)
		const rows = await query.execute()
		return rows.map((row) => ({
			...toShape(row),
			customerName: (row as any).customer_name ?? undefined,
			customerEmail: (row as any).customer_email ?? undefined,
		}))
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
