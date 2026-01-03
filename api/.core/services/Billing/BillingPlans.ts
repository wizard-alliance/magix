import type { BillingPlanDBRow, BillingPlanFeatureDBRow } from "../../schema/Database.js"
import type { BillingPlan, BillingPlanFeature, BillingPlanFull } from "../../schema/DomainShapes.js"

const toShape = (row: BillingPlanDBRow): BillingPlan => ({
	id: row.id!,
	name: row.name,
	providerPriceId: row.provider_price_id,
	price: row.price,
	currency: row.currency,
	description: row.description,
	isActive: row.is_active === 1,
	created: row.created,
	updated: row.updated,
})

const toFeatureShape = (row: BillingPlanFeatureDBRow): BillingPlanFeature => ({
	id: row.id!,
	planId: row.plan_id,
	featureName: row.feature_name,
	description: row.description,
	created: row.created,
})

export class BillingPlans {
	private db = api.DB.connection

	async get(params: Partial<BillingPlanDBRow>): Promise<BillingPlanFull | null> {
		let query = this.db.selectFrom("billing_plans").selectAll()
		query = api.Utils.applyWhere(query, params)
		const row = await query.executeTakeFirst()
		if (!row) return null
		const plan = toShape(row)
		const features = await this.getFeatures({ plan_id: plan.id })
		return { ...plan, features }
	}

	async getMany(params: Partial<BillingPlanDBRow> = {}, options = {}): Promise<BillingPlan[]> {
		let query = this.db.selectFrom("billing_plans").selectAll()
		query = api.Utils.applyWhere(query, params)
		query = api.Utils.applyOptions(query, options)
		const rows = await query.execute()
		return rows.map(toShape)
	}

	async set(params: Partial<BillingPlanDBRow>) {
		const result = await this.db.insertInto("billing_plans").values(params as any).executeTakeFirst()
		return { id: result.insertId ? Number(result.insertId) : null }
	}

	async update(data: Partial<BillingPlanDBRow>, where: Partial<BillingPlanDBRow>) {
		let query = this.db.updateTable("billing_plans").set(data)
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numUpdatedRows: Number(result.numUpdatedRows) }
	}

	async delete(where: Partial<BillingPlanDBRow>) {
		let query = this.db.deleteFrom("billing_plans")
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numDeletedRows: Number(result.numDeletedRows) }
	}

	// Plan Features
	async getFeature(params: Partial<BillingPlanFeatureDBRow>): Promise<BillingPlanFeature | null> {
		let query = this.db.selectFrom("billing_plan_features").selectAll()
		query = api.Utils.applyWhere(query, params)
		const row = await query.executeTakeFirst()
		return row ? toFeatureShape(row) : null
	}

	async getFeatures(params: Partial<BillingPlanFeatureDBRow> = {}, options = {}): Promise<BillingPlanFeature[]> {
		let query = this.db.selectFrom("billing_plan_features").selectAll()
		query = api.Utils.applyWhere(query, params)
		query = api.Utils.applyOptions(query, options)
		const rows = await query.execute()
		return rows.map(toFeatureShape)
	}

	async setFeature(params: Partial<BillingPlanFeatureDBRow>) {
		const result = await this.db.insertInto("billing_plan_features").values(params as any).executeTakeFirst()
		return { id: result.insertId ? Number(result.insertId) : null }
	}

	async updateFeature(data: Partial<BillingPlanFeatureDBRow>, where: Partial<BillingPlanFeatureDBRow>) {
		let query = this.db.updateTable("billing_plan_features").set(data)
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numUpdatedRows: Number(result.numUpdatedRows) }
	}

	async deleteFeature(where: Partial<BillingPlanFeatureDBRow>) {
		let query = this.db.deleteFrom("billing_plan_features")
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numDeletedRows: Number(result.numDeletedRows) }
	}
}
