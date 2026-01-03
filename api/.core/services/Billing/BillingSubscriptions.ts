import type { BillingSubscriptionDBRow } from "../../schema/Database.js"
import type { BillingSubscription } from "../../schema/DomainShapes.js"

const toShape = (row: BillingSubscriptionDBRow): BillingSubscription => ({
	id: row.id!,
	customerId: row.customer_id,
	planId: row.plan_id,
	providerSubscriptionId: row.provider_subscription_id,
	currentPeriodStart: row.current_period_start,
	currentPeriodEnd: row.current_period_end,
	cancelAtPeriodEnd: row.cancel_at_period_end === 1,
	canceledAt: row.canceled_at,
	pausedAt: row.paused_at,
	status: row.status,
	created: row.created,
	updated: row.updated,
})

export class BillingSubscriptions {
	private db = api.DB.connection

	async get(params: Partial<BillingSubscriptionDBRow>): Promise<BillingSubscription | null> {
		let query = this.db.selectFrom("billing_subscriptions").selectAll()
		query = api.Utils.applyWhere(query, params)
		const row = await query.executeTakeFirst()
		return row ? toShape(row) : null
	}

	async getMany(params: Partial<BillingSubscriptionDBRow> = {}, options = {}): Promise<BillingSubscription[]> {
		let query = this.db.selectFrom("billing_subscriptions").selectAll()
		query = api.Utils.applyWhere(query, params)
		query = api.Utils.applyOptions(query, options)
		const rows = await query.execute()
		return rows.map(toShape)
	}

	async set(params: Partial<BillingSubscriptionDBRow>) {
		const result = await this.db.insertInto("billing_subscriptions").values(params).executeTakeFirst()
		return { id: result.insertId ? Number(result.insertId) : null }
	}

	async update(data: Partial<BillingSubscriptionDBRow>, where: Partial<BillingSubscriptionDBRow>) {
		let query = this.db.updateTable("billing_subscriptions").set(data)
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numUpdatedRows: Number(result.numUpdatedRows) }
	}

	async delete(where: Partial<BillingSubscriptionDBRow>) {
		let query = this.db.deleteFrom("billing_subscriptions")
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numDeletedRows: Number(result.numDeletedRows) }
	}
}
