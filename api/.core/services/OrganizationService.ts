import type { UserOrganizationDBRow } from "../schema/Database.js"
import type { Organization } from "../schema/DomainShapes.js"

const toShape = (row: UserOrganizationDBRow): Organization => ({
	id: row.id!,
	ownerId: row.owner_id,
	parentOrg: row.parent_org,
	name: row.name,
	description: row.description,
	vatId: row.vat_id,
	created: row.created,
	updated: row.updated,
})

export class OrganizationService {
	private db = api.DB.connection

	async get(params: Partial<UserOrganizationDBRow>): Promise<Organization | null> {
		let query = this.db.selectFrom("user_organization").selectAll()
		query = api.Utils.applyWhere(query, params)
		const row = await query.executeTakeFirst()
		return row ? toShape(row) : null
	}

	async getMany(params: Partial<UserOrganizationDBRow> = {}, options = {}): Promise<Organization[]> {
		let query = this.db.selectFrom("user_organization").selectAll()
		query = api.Utils.applyWhere(query, params)
		query = api.Utils.applyOptions(query, options)
		const rows = await query.execute()
		return rows.map(toShape)
	}

	async set(params: Partial<UserOrganizationDBRow>) {
		return this.db.insertInto("user_organization").values(params as any).executeTakeFirst()
	}

	async update(data: Partial<UserOrganizationDBRow>, where: Partial<UserOrganizationDBRow>) {
		let query = this.db.updateTable("user_organization").set(data)
		query = api.Utils.applyWhere(query, where)
		return query.executeTakeFirst()
	}

	async delete(where: Partial<UserOrganizationDBRow>) {
		let query = this.db.deleteFrom("user_organization")
		query = api.Utils.applyWhere(query, where)
		return query.executeTakeFirst()
	}
}
