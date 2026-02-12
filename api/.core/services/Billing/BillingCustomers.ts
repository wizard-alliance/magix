import type { BillingCustomerDBRow } from "../../schema/Database.js"
import type { BillingCustomer, BillingCustomerFull } from "../../schema/DomainShapes.js"

const toShape = (row: BillingCustomerDBRow): BillingCustomer => ({
	id: row.id!,
	userId: row.user_id,
	companyId: row.company_id,
	isGuest: row.is_guest === 1,
	billingName: row.billing_name,
	billingEmail: row.billing_email,
	billingPhone: row.billing_phone,
	billingAddress: {
		line1: row.billing_address_line1,
		line2: row.billing_address_line2,
		city: row.billing_city,
		state: row.billing_state,
		zip: row.billing_zip,
		country: row.billing_country,
		latitude: row.billing_latitude,
		longitude: row.billing_longitude,
	},
	vatId: row.vat_id,
	providerCustomerId: row.provider_customer_id,
	created: row.created,
	updated: row.updated,
})

export class BillingCustomers {
	private db = api.DB.connection

	async get(params: Partial<BillingCustomerDBRow>): Promise<BillingCustomerFull | null> {
		let query = this.db.selectFrom("billing_customers").selectAll()
		query = api.Utils.applyWhere(query, params)
		const row = await query.executeTakeFirst()
		if (!row) return null
		const customer = toShape(row)
		const [subscriptions, invoices, orders] = await Promise.all([
			api.Billing.Subscriptions.getMany({ customer_id: customer.id }),
			api.Billing.Invoices.getMany({ customer_id: customer.id }),
			api.Billing.Orders.getMany({ customer_id: customer.id }),
		])
		return { ...customer, subscriptions, invoices, orders }
	}

	async getMany(params: Partial<BillingCustomerDBRow> = {}, options: Record<string, any> = {}): Promise<(BillingCustomer & { productName?: string; planName?: string })[]> {
		let query = this.db.selectFrom("billing_customers").selectAll("billing_customers")

		// Search: LIKE on billing_name/billing_email
		if (options.search) {
			const term = `%${options.search}%`
			query = query.where((eb) =>
				eb.or([
					eb("billing_name", "like", term),
					eb("billing_email", "like", term),
				])
			)
		}

		query = api.Utils.applyWhere(query, params)
		query = api.Utils.applyOptions(query, options)
		const rows = await query.execute()
		const customers = rows.map(toShape)

		// Optionally enrich with active subscription/product info
		if (options.includeSubscriptions && customers.length) {
			const ids = customers.map((c) => c.id)
			const subs = await this.db
				.selectFrom("billing_subscriptions")
				.leftJoin("billing_products", "billing_products.id", "billing_subscriptions.plan_id")
				.select([
					"billing_subscriptions.customer_id",
					"billing_subscriptions.status",
					"billing_products.name as product_name",
					"billing_products.type as product_type",
				])
				.where("billing_subscriptions.customer_id", "in", ids)
				.where("billing_subscriptions.status", "in", ["active", "paused", "past_due"])
				.execute()

			const subMap = new Map<number, { productName: string; status: string }>()
			for (const s of subs) {
				if (!subMap.has(s.customer_id)) {
					subMap.set(s.customer_id, { productName: (s as any).product_name ?? `—`, status: s.status })
				}
			}

			return customers.map((c) => {
				const sub = subMap.get(c.id)
				return { ...c, productName: sub?.productName ?? `—`, subscriptionStatus: sub?.status ?? `—` }
			})
		}

		return customers
	}

	async set(params: Partial<BillingCustomerDBRow>) {
		const isGuest = params.is_guest === 1
		if (!isGuest && !params.user_id && !params.company_id) {
			return { error: "A customer must have a user, a company, or be a guest.", code: 422 }
		}

		// Auto-claim: if creating for a user, check if a guest customer exists with the same email
		if (params.user_id && params.billing_email) {
			const guest = await this.db.selectFrom("billing_customers").selectAll()
				.where("is_guest", "=", 1)
				.where("billing_email", "=", params.billing_email)
				.executeTakeFirst()
			if (guest) {
				// Claim the guest record — attach user, preserve orders/subscriptions
				await this.db.updateTable("billing_customers").set({
					user_id: params.user_id,
					is_guest: 0,
					billing_name: params.billing_name || guest.billing_name,
				}).where("id", "=", guest.id!).executeTakeFirst()
				return { id: Number(guest.id), claimed: true }
			}
		}

		if (params.user_id) {
			const existing = await this.db.selectFrom("billing_customers").select("id").where("user_id", "=", params.user_id).executeTakeFirst()
			if (existing) return { error: "A billing customer already exists for this user", code: 409 }
		}
		if (params.company_id) {
			const existing = await this.db.selectFrom("billing_customers").select("id").where("company_id", "=", params.company_id).executeTakeFirst()
			if (existing) return { error: "A billing customer already exists for this company", code: 409 }
		}
		const result = await this.db.insertInto("billing_customers").values(params as any).executeTakeFirst()
		return { id: result.insertId ? Number(result.insertId) : null }
	}

	async update(data: Partial<BillingCustomerDBRow>, where: Partial<BillingCustomerDBRow>) {
		let query = this.db.updateTable("billing_customers").set(data)
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numUpdatedRows: Number(result.numUpdatedRows) }
	}

	async delete(where: Partial<BillingCustomerDBRow>) {
		let query = this.db.deleteFrom("billing_customers")
		query = api.Utils.applyWhere(query, where)
		const result = await query.executeTakeFirst()
		return { numDeletedRows: Number(result.numDeletedRows) }
	}
}
