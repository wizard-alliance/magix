

const toBigIntSafe = (val: any): any => {
	if (typeof val === "bigint") return Number(val)
	if (Array.isArray(val)) return val.map(toBigIntSafe)
	if (val && typeof val === "object") {
		return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, toBigIntSafe(v)]))
	}
	return val
}

export class CrudMethods<Shape = any, DBRow = any> {
	private DB = api.DB.connection

	async get(tableName: string, params: Partial<DBRow> = {}): Promise<Shape | null> {
		if (!Object.keys(params).length) return null
		return (await this.getMany(tableName, params, { limit: 1 }))[0] || null
	}

	async getMany(tableName: string, params: Partial<DBRow> = {}, options: any = {}): Promise<Shape[]> {
		const cacheKey = { type: `${tableName}:getMany`, ...params, ...options }
		const cacheValue = api.Cache.get(cacheKey)
		if (cacheValue) { return cacheValue }

		let query = this.DB.selectFrom(tableName as any).selectAll()
		query = api.Utils.applyWhere(query, params)
		query = api.Utils.applyOptions(query, options)
		
		const results = await query.execute() as Shape[]
		if (!results) { return [] }
		api.Cache.set(cacheKey, results, 10)
		return results
	}

	async create(tableName: string, params: Partial<DBRow> = {}): Promise<any> {
		try {
			const result = await this.DB.insertInto(tableName as any).values(params).executeTakeFirst()
			api.Cache.clearAll()
			return toBigIntSafe(result)
		} catch (error: any) {
			return { error }
		}
	}

	async update(tableName: string, data: Partial<DBRow> = {}, where: Partial<DBRow> = {}): Promise<any> {
		try {
			let query = this.DB.updateTable(tableName as any).set(data)
			query = api.Utils.applyWhere(query, where)
			const result = await query.executeTakeFirst()
			api.Cache.clearAll()
			return toBigIntSafe(result)
		} catch (error: any) {
			return { error }
		}
	}

	async delete(tableName: string, params: Partial<DBRow> = {}): Promise<any> {
		try {
			let query = this.DB.deleteFrom(tableName as any)
			query = api.Utils.applyWhere(query, params)
			const result = await query.executeTakeFirst()
			const safe = toBigIntSafe(result)
			api.Cache.clearAll()
			return safe?.numDeletedRows < 1 ? null : safe
		} catch (error: any) {
			return { error }
		}
	}
}