export class CrudMethods<Shape = any, DBRow = any> {
	private DB = api.Services.DB.connection

	async get(tableName: string, params: Partial<DBRow> = {}): Promise<Shape | null> {
		return (await this.getMany(tableName, params, { limit: 1 }))[0] || null
	}

	async getMany(tableName: string, params: Partial<DBRow> = {}, options: any = {}): Promise<Shape[]> {
		const cacheKey = { type: `${tableName}:getMany`, ...params, ...options }
		const cacheValue = api.Data.Cache.get(cacheKey)
		if (cacheValue) { return cacheValue }

		let query = this.DB.selectFrom(tableName as any).selectAll()
		query = api.Data.applyWhere(query, params)
		query = api.Data.applyOptions(query, options)
		
		const results = await query.execute() as Shape[]
		if (!results) { return [] }
		api.Data.Cache.set(cacheKey, results, 10)
		return results
	}

	async create(tableName: string, params: Partial<DBRow> = {}): Promise<any> {
		let response = {} as any
		const query = this.DB.insertInto(tableName as any).values(params)

		try { response = await query.execute() }
		catch (error: any) { response.error = error }
		return response[0] || response
	}

	async update(tableName: string, params: Partial<DBRow> = {}, where: Partial<DBRow> = {}): Promise<any> {
		let response = {} as any
		let query = this.DB.updateTable(tableName as any).set(params)
		query = api.Data.applyWhere(query, where)

		try { response = await query.execute() }
		catch (error: any) { response.error = error }
		return response[0] || response
	}

	async delete(tableName: string, params: Partial<DBRow> = {}): Promise<any> {
		let response = {} as any
		let query = this.DB.deleteFrom(tableName as any)
		query = api.Data.applyWhere(query, params)

		try { response = await query.execute() }
		catch (error: any) { response.error = error }
		
		response = response[0] || response
		return response.numDeletedRows < 1 ? null : response
	}
}