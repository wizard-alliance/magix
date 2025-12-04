import type { SettingDBRow } from "../../schema/Database.js"
import type { Settings } from "../../schema/DomainShapes.js"

export class SettingsData {
	private DB = api.Services.DB.connection
	private table = api.Schema.Database.TableMap['settings']

	constructor(private readonly deps: any) {
		this.table = this.deps.tables.settings
	}

	async get(params: Partial<SettingDBRow> = {}): Promise<Settings | null> {
		return (await this.getMany(params, { limit: 1 }))[0] || null
	}

	async getMany(params: Partial<SettingDBRow> = {}, options: any = {}): Promise<Settings[]> {
		const cacheKey = { type: "Settings:getMany", ...params, ...options }
		const cacheValue = this.deps.getCache(cacheKey)
		if (cacheValue) {
			return cacheValue
		}

		let query = this.DB.selectFrom(this.table).selectAll()
		query = this.deps.applyWhere(query, params)
		query = this.deps.applyOptions(query, options)
		const results = await query.execute()

		if (!results) {
			return []
		}

		if (options.debug) {
			api.Log(`SQL Query: ${query.compile().sql}`, "SettingsData")
		}

		const settings = results.map((result: any) => ({
			ID: result.ID,
			version: result.version || 1,
			autoload: result.autoload || 0,
			key: result.key || "",
			value: result.value || "",
			dates: {
				created: result.created,
				updated: result.updated,
			},
		}))

		return Promise.all(settings).then((resolved) => {
			this.deps.setCache(cacheKey, resolved, 10)
			return resolved
		})
	}

	async create(params: Partial<SettingDBRow> = {}): Promise<any> {
		let response = {} as any
		const query = this.DB.insertInto(this.table).values(params)

		try { response = await query.execute() }
		catch (error: any) { response.error = error }
		
		response = response[0] || response

		return response
	}

	async update(params: Partial<SettingDBRow> = {}, where: Partial<SettingDBRow> = {}): Promise<any> {
		let response = {} as any

		if (!where || Object.keys(where).length === 0) {
			where.ID = params.ID!;
			where.key = params.key!;
		}

		let query = this.DB.updateTable(this.table).set(params)
		query = this.deps.applyWhere(query, where)

		try { response = await query.execute() }
		catch (error: any) { response.error = error }
		
		response = response[0] || response

		return response
	}

	async delete(params: Partial<SettingDBRow> = {}): Promise<any> {
		let response = {} as any
		let query = this.DB.deleteFrom(this.table)
		query = this.deps.applyWhere(query, params)

		try { response = await query.execute() }
		catch (error: any) { response.error = error }
		
		response = response[0] || response

		if (!response || !response.numDeletedRows || response.numDeletedRows < 1) {
			return null
		}

		return response
	}
}
