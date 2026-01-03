import type { BillingProductDBRow, BillingProductFeatureDBRow } from "../../schema/Database.js"
import type { BillingProduct, BillingProductFeature, BillingProductFull } from "../../schema/DomainShapes.js"

const toShape = (row: BillingProductDBRow): BillingProduct => ({
	id: row.id!,
	name: row.name,
	type: row.type,
	providerId: row.provider_id,
	providerVariantId: row.provider_variant_id,
	price: row.price,
	currency: row.currency,
	interval: row.interval,
	intervalCount: row.interval_count,
	trialDays: row.trial_days,
	sortOrder: row.sort_order,
	description: row.description,
	isActive: row.is_active === 1,
	created: row.created,
	updated: row.updated,
})

const toFeatureShape = (row: BillingProductFeatureDBRow): BillingProductFeature => ({
	id: row.id!,
	productId: row.product_id,
	featureName: row.feature_name,
	description: row.description,
	created: row.created,
})

export class BillingProducts {
	private db = api.DB.connection

	async get(params: Partial<BillingProductDBRow>): Promise<BillingProductFull | null> {
		let query = this.db.selectFrom("billing_products").selectAll()
		query = api.Utils.applyWhere(query, params)
		const row = await query.executeTakeFirst()
		if (!row) return null
		const product = toShape(row)
		const features = await this.getFeatures({ product_id: product.id })
		return { ...product, features }
	}

	async getMany(params: Partial<BillingProductDBRow> = {}, options = {}): Promise<BillingProduct[]> {
		let query = this.db.selectFrom("billing_products").selectAll()
		query = api.Utils.applyWhere(query, params)
		query = api.Utils.applyOptions(query, options)
		const rows = await query.execute()
		return rows.map(toShape)
	}

	async set(params: Partial<BillingProductDBRow>) {
		const result = await this.db.insertInto("billing_products").values(params as any).executeTakeFirst()
		return { id: result.insertId ? Number(result.insertId) : null }
	}

	async update(data: Partial<BillingProductDBRow>, where: Partial<BillingProductDBRow>) {
		let query = this.db.updateTable("billing_products").set(data)
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numUpdatedRows: Number(result.numUpdatedRows) }
	}

	async delete(where: Partial<BillingProductDBRow>) {
		let query = this.db.deleteFrom("billing_products")
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numDeletedRows: Number(result.numDeletedRows) }
	}

	// Product Features
	async getFeature(params: Partial<BillingProductFeatureDBRow>): Promise<BillingProductFeature | null> {
		let query = this.db.selectFrom("billing_product_features").selectAll()
		query = api.Utils.applyWhere(query, params)
		const row = await query.executeTakeFirst()
		return row ? toFeatureShape(row) : null
	}

	async getFeatures(params: Partial<BillingProductFeatureDBRow> = {}, options = {}): Promise<BillingProductFeature[]> {
		let query = this.db.selectFrom("billing_product_features").selectAll()
		query = api.Utils.applyWhere(query, params)
		query = api.Utils.applyOptions(query, options)
		const rows = await query.execute()
		return rows.map(toFeatureShape)
	}

	async setFeature(params: Partial<BillingProductFeatureDBRow>) {
		const result = await this.db.insertInto("billing_product_features").values(params as any).executeTakeFirst()
		return { id: result.insertId ? Number(result.insertId) : null }
	}

	async updateFeature(data: Partial<BillingProductFeatureDBRow>, where: Partial<BillingProductFeatureDBRow>) {
		let query = this.db.updateTable("billing_product_features").set(data)
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numUpdatedRows: Number(result.numUpdatedRows) }
	}

	async deleteFeature(where: Partial<BillingProductFeatureDBRow>) {
		let query = this.db.deleteFrom("billing_product_features")
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numDeletedRows: Number(result.numDeletedRows) }
	}
}
