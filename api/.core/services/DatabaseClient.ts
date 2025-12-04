import {
	Kysely,
	MysqlDialect,
	sql,
	type Insertable,
	type Selectable,
	type Updateable
} from "kysely"
import type { Request } from "express"
import { createPool } from "mysql2"

import type { DatabaseSchema } from '../schema/Database.js'
import { tableColumnSets } from '../schema/Database.js'


export const globalColumnWhitelist = new Set<string>(
	Object.values(tableColumnSets).flatMap((set) => Array.from(set))
)

type SortDirection = 'asc' | 'desc' | 'rand'

type QueryOptions = {
	limit?: number
	offset?: number
	page?: number
	sort?: string | readonly string[]
	sortDir?: SortDirection | readonly SortDirection[]
}

type ConvertParamsOptions = {
	table?: keyof DatabaseSchema
	allowedKeys?: readonly string[]
}

type ConvertedParams<Row> = {
	params: Insertable<Row>
	values: Insertable<Row>
	options: QueryOptions & { max?: number }
}

type UpsertResult = {
	created: boolean
	updated: boolean
	count: number
	insertId: number | null
}

type FilterValue<Value> = Value | readonly Value[]
type RowFilter<Row> = {
	[K in keyof Row]?: FilterValue<Row[K]>
}
type TableFilter<Name extends keyof DatabaseSchema> = RowFilter<Selectable<DatabaseSchema[Name]>>
type FilterPayload<Name extends keyof DatabaseSchema> = TableFilter<Name> & QueryOptions

export class DatabaseClient {
	private instance: Kysely<DatabaseSchema> | null = null
	private prefix = "DatabaseClient"

	public readonly settings = this.table("settings")

	public readonly users = this.table("users")
	public readonly userDevices = this.table("user_devices")
	public readonly userNotifications = this.table("user_notifications")
	public readonly userPermissions = this.table("user_permissions")
	public readonly userSettings = this.table("user_settings")
	public readonly userTokensAccess = this.table("user_tokens_access")
	public readonly userTokensBlacklist = this.table("user_tokens_blacklist")
	public readonly userTokensRefresh = this.table("user_tokens_refresh")
	public readonly userTokensSingle = this.table("user_tokens_single")

	private readonly config = {
		host: api.Config("DB_HOST"),
		port: Number(api.Config("DB_PORT")),
		user: api.Config("DB_USER"),
		password: api.Config("DB_PASSWORD"),
		database: api.Config("DB_NAME"),
	}

	isConfigured = () => {
		return (
			this.config.host !== "" &&
			this.config.user !== "" &&
			this.config.database !== ""
		)
	}

	private createDialect = () => {
		return new MysqlDialect({
			pool: createPool({
				host: this.config.host,
				port: this.config.port,
				user: this.config.user,
				password: this.config.password,
				database: this.config.database,

				waitForConnections: true,
				queueLimit: 0,
				connectTimeout: 2000,
				supportBigNumbers: true,
				decimalNumbers: true,
			}),
		})
	}

	public convertRequestParams<T extends keyof DatabaseSchema>(
		request: Request,
		options: ConvertParamsOptions & { table: T }
	): ConvertedParams<DatabaseSchema[T]>
	public convertRequestParams(
		request: Request,
		options?: ConvertParamsOptions
	): ConvertedParams<DatabaseSchema[keyof DatabaseSchema]>
	public convertRequestParams(
		request: Request,
		options: ConvertParamsOptions = {}
	) {
		const rawParams = api.getParams(request) as Record<string, unknown>
		return this.convertParams(
			rawParams,
			options as ConvertParamsOptions & { table?: keyof DatabaseSchema }
		)
	}

	/**
	 * Converts express request params to database row types and splits it into params, values & handles value conversions
	 */
	public convertParams<T extends keyof DatabaseSchema>(
		rawParams: Record<string, unknown>,
		options: ConvertParamsOptions & { table: T }
	): ConvertedParams<DatabaseSchema[T]>
	public convertParams(
		rawParams?: Record<string, unknown>,
		options?: ConvertParamsOptions
	): ConvertedParams<DatabaseSchema[keyof DatabaseSchema]>
	public convertParams(
		rawParams: Record<string, unknown> = {},
		options: ConvertParamsOptions = {}
	): ConvertedParams<DatabaseSchema[keyof DatabaseSchema]> {
		const numericOptionKeys = ["limit", "offset", "page", "max"] as const
		type NumericOptionKey = (typeof numericOptionKeys)[number]
		const params: Record<string, unknown> = {}
		const values: Record<string, unknown> = {}
		const paginationOptions: Partial<QueryOptions & { max?: number }> = {}
		const allowedSet = (() => {
			if (options.allowedKeys && options.allowedKeys.length) {
				return new Set(options.allowedKeys.map((key) => `${key}`)) as ReadonlySet<string>
			}
			if (options.table) {
				return tableColumnSets[options.table]
			}
			return globalColumnWhitelist
		})()

		const numericPattern = /^-?\d+(?:\.\d+)?$/

		const normalizeValue = (value: unknown): unknown => {
			if (value === undefined) return undefined
			if (value === null) return null
			if (Array.isArray(value)) {
				const normalizedArray = value
					.map((entry) => normalizeValue(entry))
					.filter((entry) => entry !== undefined)
				return normalizedArray.length ? normalizedArray : undefined
			}
			if (typeof value === "string") {
				const trimmed = value.trim()
				if (!trimmed.length || trimmed.toLowerCase() === "undefined") {
					return undefined
				}
				if (trimmed.toLowerCase() === "null") return null
				if (trimmed.toLowerCase() === "true") return true
				if (trimmed.toLowerCase() === "false") return false
				if (numericPattern.test(trimmed)) {
					const parsed = Number(trimmed)
					return Number.isNaN(parsed) ? trimmed : parsed
				}
				return trimmed
			}
			if (typeof value === "number") {
				return Number.isFinite(value) ? value : undefined
			}
			return value
		}

		const assignValue = (
			target: Record<string, unknown>,
			key: string,
			value: unknown
		) => {
			if (!allowedSet.has(key)) {
				return
			}
			const normalized = normalizeValue(value)
			if (normalized !== undefined) {
				target[key] = normalized
			}
		}

		const assignGroup = (
			source: unknown,
			target: Record<string, unknown>
		) => {
			if (!source || typeof source !== "object") {
				return
			}
			for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
				assignValue(target, key, value)
			}
		}

		const assignNumericOption = (key: NumericOptionKey, value: unknown) => {
			const normalized = normalizeValue(value)
			if (typeof normalized !== "number" || Number.isNaN(normalized)) {
				return
			}
			const base = key === "page" ? Math.max(1, Math.floor(normalized)) : Math.max(0, Math.floor(normalized))
				; (paginationOptions as Record<NumericOptionKey, number>)[key] = base
		}

		const normalizeStrings = (value: unknown): string[] => {
			if (typeof value === "string") {
				const trimmed = value.trim()
				return trimmed ? [trimmed] : []
			}
			if (Array.isArray(value)) {
				return value
					.map(entry => (typeof entry === "string" ? entry.trim() : ""))
					.filter(Boolean)
			}
			return []
		}

		const assignSort = (value: unknown) => {
			const columns = normalizeStrings(value)
			if (!columns.length) return
			paginationOptions.sort = columns.length === 1 ? columns[0] : columns
		}

		const assignSortDir = (value: unknown) => {
			const dirs = normalizeStrings(value).map(entry => entry.toLowerCase() as SortDirection)
			const allowed = dirs.filter(entry => entry === "asc" || entry === "desc" || entry === "rand")
			if (!allowed.length) return
			paginationOptions.sortDir = allowed.length === 1 ? allowed[0] : allowed
		}

		for (const [key, value] of Object.entries(rawParams ?? {})) {
			if (numericOptionKeys.includes(key as NumericOptionKey)) {
				assignNumericOption(key as NumericOptionKey, value)
				continue
			}

			if (key === "sort") {
				assignSort(value)
				continue
			}

			if (key === "sortDir") {
				assignSortDir(value)
				continue
			}

			if (["params", "filters", "where"].includes(key)) {
				assignGroup(value, params)
				continue
			}

			if (["values", "data", "payload", "set"].includes(key)) {
				assignGroup(value, values)
				continue
			}

			if (/^(param_|filter_|where_)/.test(key)) {
				const normalizedKey = key.replace(/^(param_|filter_|where_)/, "")
				assignValue(params, normalizedKey, value)
				continue
			}

			if (/^(value_|set_|data_)/.test(key)) {
				const normalizedKey = key.replace(/^(value_|set_|data_)/, "")
				assignValue(values, normalizedKey, value)
				continue
			}

			assignValue(params, key, value)
		}

		return {
			params: params as Insertable<DatabaseSchema[keyof DatabaseSchema]>,
			values: values as Insertable<DatabaseSchema[keyof DatabaseSchema]>,
			options: paginationOptions as QueryOptions & { max?: number },
		} as ConvertedParams<DatabaseSchema[keyof DatabaseSchema]>
	}


	// Shorthand
	get $(): Kysely<DatabaseSchema> {
		return this.connection
	}

	get connection(): Kysely<DatabaseSchema> {
		if (!this.isConfigured()) {
			throw api.Error("Database connection is not configured", "DatabaseClient")
		}

		if (!this.instance) {
			this.instance = new Kysely<DatabaseSchema>({
				dialect: this.createDialect(),
			})
		}

		return this.instance
	}

	public query = <T = unknown>(strings: TemplateStringsArray, ...values: readonly unknown[]) => {
		return sql<T>(strings, ...values).execute(this.connection)
	}

	async getServerVersion() {
		if (!this.isConfigured()) {
			return null
		}

		return await this.connection
			.selectFrom("settings")
			.select(["value"])
			.where("key", "=", "server_version")
			.executeTakeFirst()
			.then((row) => row?.value ?? null)
	}


	async destroy() {
		if (this.instance) {
			await this.instance.destroy()
			this.instance = null
			api.Log("database connection pool destroyed")
		}
	}

	private table<Name extends keyof DatabaseSchema>(table: Name) {
		type Table = DatabaseSchema[Name]
		type Row = Selectable<Table>
		type Filter = RowFilter<Row> & QueryOptions
		type Update = Updateable<Table>
		type Insert = Insertable<Table>
		type UpdateArgs = { where: RowFilter<Row>; values: Update }
		type SetArgs = { where: Partial<Row>; values: Insert }
		return {
			get: (filters: Filter = {}) => this.getRows(table, filters),
			create: (values: Insert) => this.createRow(table, values),
			update: (payload: UpdateArgs) => this.updateRows(table, payload),
			set: (payload: SetArgs) => this.setRow(table, payload),
			unset: (filters: Filter) => this.unsetRow(table, filters),
			exists: (filters: Filter) => this.existsRow(table, filters),
		}
	}

	private async getRows<Name extends keyof DatabaseSchema>(
		table: Name,
		filters: FilterPayload<Name> & { limit: 1 }
	): Promise<Selectable<DatabaseSchema[Name]> | null>
	private async getRows<Name extends keyof DatabaseSchema>(
		table: Name,
		filters?: FilterPayload<Name>
	): Promise<Array<Selectable<DatabaseSchema[Name]>>>
	private async getRows<Name extends keyof DatabaseSchema>(
		table: Name,
		filters: FilterPayload<Name> = {} as FilterPayload<Name>
	) {
		const { limit, offset, page, sort, sortDir, ...rawFilters } = filters
		const sanitized = rawFilters as TableFilter<Name>
		const hasLimit = typeof limit === "number" && limit > 0
		const effectiveLimit = hasLimit ? Math.floor(limit!) : undefined
		let effectiveOffset =
			typeof offset === "number" && offset >= 0 ? Math.floor(offset) : undefined

		const normalizeSortColumns = (input?: string | readonly string[]): string[] => {
			if (Array.isArray(input)) {
				return input.map(entry => (typeof entry === "string" ? entry.trim() : "")).filter(Boolean)
			}
			if (typeof input === "string") {
				const trimmed = input.trim()
				return trimmed ? [trimmed] : []
			}
			return []
		}

		const normalizeSortDirections = (
			input?: SortDirection | readonly SortDirection[] | string | readonly string[]
		): SortDirection[] => {
			if (Array.isArray(input)) {
				return input
					.map(entry => (typeof entry === "string" ? entry.trim().toLowerCase() : ""))
					.filter((entry): entry is SortDirection => entry === "asc" || entry === "desc" || entry === "rand")
			}
			if (typeof input === "string") {
				const normalized = input.trim().toLowerCase()
				return normalized === "asc" || normalized === "desc" || normalized === "rand" ? [normalized] : []
			}
			return []
		}

		const sortColumns = normalizeSortColumns(sort)
		const sortDirections = normalizeSortDirections(sortDir)
		const sortSet = tableColumnSets[table]

		if (page !== undefined) {
			if (!effectiveLimit) {
				throw api.Error(`limit is required when specifying page for ${String(table)}`, this.prefix)
			}
			const pageNumber = Math.max(1, Math.floor(page))
			effectiveOffset = (pageNumber - 1) * effectiveLimit
		}

		this.ensureFilters(table, sanitized, true)

		try {
			let query: any = this.applyFilters(
				this.connection.selectFrom(table).selectAll(),
				sanitized
			)

			if (sortDirections.includes("rand")) {
				query = query.orderBy(sql`RAND()`)
			} else if (sortColumns.length) {
				sortColumns.forEach((column, index) => {
					if (!sortSet.has(column as never)) {
						throw api.Error(
							`Invalid sort column ${column} for ${String(table)}`,
							this.prefix
						)
					}
					const direction = sortDirections[index] ?? sortDirections[0] ?? "asc"
					query = query.orderBy(column as any, direction)
				})
			}
			if (effectiveLimit !== undefined) {
				query = query.limit(effectiveLimit)
			}
			if (effectiveOffset !== undefined) {
				query = query.offset(effectiveOffset)
			}
			const rows = await query.execute()
			if (effectiveLimit === 1) {
				return rows[0] ?? null
			}
			return rows
		} catch (error) {
			throw api.Error(
				`query failed for ${String(table)} with filters ${JSON.stringify(filters)}: ${(error as Error).message}`,
				this.prefix
			)
		}
	}

	private async createRow<Name extends keyof DatabaseSchema>(
		table: Name,
		values: Insertable<DatabaseSchema[Name]>
	): Promise<number | null> {
		this.ensureValues(table, values as Record<string, unknown>)
		try {
			const result = await (this.connection.insertInto(table) as any)
				.values(values as Record<string, unknown>)
				.executeTakeFirst()
			const insertId = result?.insertId
			if (typeof insertId === "bigint") {
				return Number(insertId)
			}
			return typeof insertId === "number" ? insertId : null
		} catch (error) {
			throw api.Error(
				`insert failed for ${String(table)}: ${(error as Error).message}`,
				this.prefix
			)
		}
	}

	private async updateRows<Name extends keyof DatabaseSchema>(
		table: Name,
		payload: {
			where: TableFilter<Name>
			values: Updateable<DatabaseSchema[Name]>
		}
	): Promise<number> {
		const { where, values } = payload
		this.ensureFilters(table, where)
		this.ensureValues(table, values as Record<string, unknown>)
		try {
			const updated = (this.connection.updateTable(table) as any).set(
				values as Record<string, unknown>
			)
			const query = this.applyFilters(updated, where)
			const result = await query.executeTakeFirst()
			const count = result?.numUpdatedRows
			return count ? Number(count) : 0
		} catch (error) {
			throw api.Error(
				`update failed for ${String(table)} with where ${JSON.stringify(where)}: ${(error as Error).message}`,
				this.prefix
			)
		}
	}

	private async setRow<Name extends keyof DatabaseSchema>(
		table: Name,
		payload: {
			where: Partial<Selectable<DatabaseSchema[Name]>>
			values: Insertable<DatabaseSchema[Name]>
		}
	): Promise<UpsertResult> {
		const { where, values } = payload
		const updatedCount = await this.updateRows(table, {
			where,
			values: values as Updateable<DatabaseSchema[Name]>,
		})
		if (updatedCount > 0) {
			return {
				created: false,
				updated: true,
				count: updatedCount,
				insertId: null,
			}
		}
		const insertValues = {
			...where,
			...values,
		} as Insertable<DatabaseSchema[Name]>
		const insertId = await this.createRow(table, insertValues)
		return {
			created: true,
			updated: false,
			count: insertId ? 1 : 0,
			insertId,
		}
	}

	private async unsetRow<Name extends keyof DatabaseSchema>(
		table: Name,
		filters: FilterPayload<Name>
	) {
		const { limit, offset, page, ...criteria } = filters
		if (limit !== undefined || offset !== undefined || page !== undefined) {
			throw api.Error(`limit, offset, and page are not supported for mutations on ${String(table)}`, this.prefix)
		}
		const sanitized = criteria as TableFilter<Name>
		this.ensureFilters(table, sanitized)
		const query = this.applyFilters(
			(this.connection.deleteFrom(table)) as any,
			sanitized
		)
		const result = await query.executeTakeFirst()
		const count = result?.numDeletedRows
		return count ? Number(count) : 0
	}

	private async existsRow<Name extends keyof DatabaseSchema>(
		table: Name,
		filters: FilterPayload<Name>
	) {
		const row = await this.getRows(table, { ...filters, limit: 1 })
		return !!row
	}

	private ensureFilters<Name extends keyof DatabaseSchema>(
		table: Name,
		filters: TableFilter<Name>,
		allowEmpty = false
	) {
		if (allowEmpty) {
			return
		}
		const hasFilters = Object.values(filters ?? {}).some((value) => {
			if (value === undefined) {
				return false
			}
			if (Array.isArray(value)) {
				return value.some((entry) => entry !== undefined)
			}
			return true
		})
		if (!hasFilters) {
			throw api.Error(`Filters required for ${String(table)}`, this.prefix)
		}
	}

	private ensureValues(
		table: keyof DatabaseSchema,
		values: Record<string, unknown>
	) {
		if (!values || Object.values(values).every((value) => value === undefined)) {
			throw api.Error(`Values required for ${String(table)}`, this.prefix)
		}
	}

	private applyFilters<Name extends keyof DatabaseSchema, Builder>(
		builder: Builder,
		filters: TableFilter<Name>
	) {
		let current: any = builder
		for (const [key, raw] of Object.entries(filters)) {
			if (raw === undefined) continue
			const column = key as keyof Selectable<DatabaseSchema[Name]>
			if (Array.isArray(raw)) {
				const normalized = (raw as readonly unknown[]).filter((entry) => entry !== undefined)
				if (!normalized.length) {
					continue
				}
				const nonNullValues = normalized.filter((entry) => entry !== null)
				const hasNull = normalized.length !== nonNullValues.length
				if (nonNullValues.length && hasNull) {
					current = current.where((qb: any) =>
						qb.where(column as any, "in", nonNullValues as any).orWhere(column as any, "is", null)
					)
					continue
				}
				if (nonNullValues.length) {
					current = current.where(column as any, "in", nonNullValues as any)
					continue
				}
				if (hasNull) {
					current = current.where(column as any, "is", null)
				}
				continue
			}
			if (raw === null) {
				current = current.where(column as any, "is", null)
				continue
			}
			current = current.where(column as any, "=", raw as any)
		}
		return current
	}
}
