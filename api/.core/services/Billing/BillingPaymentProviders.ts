import type { BillingPaymentProviderDBRow } from "../../schema/Database.js"
import type { BillingPaymentProvider } from "../../schema/DomainShapes.js"

const parseJson = (val: string | null) => val ? JSON.parse(val) : null

const toShape = (row: BillingPaymentProviderDBRow): BillingPaymentProvider => ({
	id: row.id!,
	name: row.name,
	config: parseJson(row.config),
	created: row.created,
	updated: row.updated,
})

export class BillingPaymentProviders {
	private db = api.DB.connection

	async get(params: Partial<BillingPaymentProviderDBRow>): Promise<BillingPaymentProvider | null> {
		let query = this.db.selectFrom("billing_payment_providers").selectAll()
		query = api.Utils.applyWhere(query, params)
		const row = await query.executeTakeFirst()
		return row ? toShape(row) : null
	}

	async getMany(params: Partial<BillingPaymentProviderDBRow> = {}, options = {}): Promise<BillingPaymentProvider[]> {
		let query = this.db.selectFrom("billing_payment_providers").selectAll()
		query = api.Utils.applyWhere(query, params)
		query = api.Utils.applyOptions(query, options)
		const rows = await query.execute()
		return rows.map(toShape)
	}

	async set(params: Partial<BillingPaymentProviderDBRow>) {
		const result = await this.db.insertInto("billing_payment_providers").values(params as any).executeTakeFirst()
		return { id: result.insertId ? Number(result.insertId) : null }
	}

	async update(data: Partial<BillingPaymentProviderDBRow>, where: Partial<BillingPaymentProviderDBRow>) {
		let query = this.db.updateTable("billing_payment_providers").set(data)
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numUpdatedRows: Number(result.numUpdatedRows) }
	}

	async delete(where: Partial<BillingPaymentProviderDBRow>) {
		let query = this.db.deleteFrom("billing_payment_providers")
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numDeletedRows: Number(result.numDeletedRows) }
	}
}
