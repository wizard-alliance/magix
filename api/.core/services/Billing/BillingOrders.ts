import type { BillingOrderDBRow } from "../../schema/Database.js"
import type { BillingOrder } from "../../schema/DomainShapes.js"

const toShape = (row: BillingOrderDBRow): BillingOrder => ({
	id: row.id!,
	customerId: row.customer_id,
	type: row.type,
	subscriptionId: row.subscription_id,
	providerOrderId: row.provider_order_id,
	amount: row.amount,
	currency: row.currency,
	status: row.status,
	paymentMethod: row.payment_method,
	paidAt: row.paid_at,
	created: row.created,
	updated: row.updated,
	parentOrderId: row.parent_order_id,
	idempotencyKey: row.idempotency_key,
})

export class BillingOrders {
	private db = api.DB.connection

	async get(params: Partial<BillingOrderDBRow>): Promise<BillingOrder | null> {
		let query = this.db.selectFrom("billing_orders").selectAll()
		query = api.Utils.applyWhere(query, params)
		const row = await query.executeTakeFirst()
		return row ? toShape(row) : null
	}

	async getMany(params: Partial<BillingOrderDBRow> = {}, options = {}): Promise<BillingOrder[]> {
		let query = this.db.selectFrom("billing_orders").selectAll()
		query = api.Utils.applyWhere(query, params)
		query = api.Utils.applyOptions(query, options)
		const rows = await query.execute()
		return rows.map(toShape)
	}

	async set(params: Partial<BillingOrderDBRow>) {
		const result = await this.db.insertInto("billing_orders").values(params as any).executeTakeFirst()
		return { id: result.insertId ? Number(result.insertId) : null }
	}

	async update(data: Partial<BillingOrderDBRow>, where: Partial<BillingOrderDBRow>) {
		let query = this.db.updateTable("billing_orders").set(data)
		query = api.Utils.applyWhere(query, where)
		return await query.executeTakeFirst()
	}

	async delete(where: Partial<BillingOrderDBRow>) {
		let query = this.db.deleteFrom("billing_orders")
		query = api.Utils.applyWhere(query, where)
		return await query.executeTakeFirst()
	}
}
