import {
	Kysely,
	MysqlDialect,
	sql,
	type Insertable,
} from "kysely"
import type { Request } from "express"
import { createPool } from "mysql2"

import type { DatabaseSchema } from '../schema/Database.js'
import { tableColumnSets } from '../schema/Database.js'

// Enable BigInt JSON serialization (Kysely returns BigInt for insert IDs)
BigInt.prototype.toJSON = function() { return api.Utils.toNumber(this) }

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

export class DatabaseClient {
	private instance: Kysely<DatabaseSchema> | null = null
	private prefix = "DatabaseClient"

	private readonly config = {
		host: api.Config("DB_HOST"),
		port: Number(api.Config("DB_PORT")),
		user: api.Config("DB_USER"),
		password: api.Config("DB_PASSWORD"),
		database: api.Config("DB_NAME"),
	}

	isConfigured = () => {
		return (this.config.host !== "" && this.config.user !== "" && this.config.database !== "")
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
				dateStrings: true,
				timezone: "Z",
			}),
		})
	}

	// Shorthand
	get $(): Kysely<DatabaseSchema> {
		return this.$
	}

	get connection(): Kysely<DatabaseSchema> {
		if (!this.isConfigured()) {
			throw api.Error("watDatabase connection is not configured", "DatabaseClient")
		}

		if (!this.instance) {
			this.instance = new Kysely<DatabaseSchema>({
				dialect: this.createDialect(),
			})
		}

		return this.instance
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
			if (typeof value === "bigint") {
				const num = api.Utils.toNumber(value)
				return num !== 0 ? num : undefined
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

	public query = <T = unknown>(strings: TemplateStringsArray, ...values: readonly unknown[]) => {
		return sql<T>(strings, ...values).execute(this.$)
	}

	async getServerVersion() {
		if (!this.isConfigured()) {
			return null
		}

		return await this.$
			.selectFrom("global_settings")
			.select(["value"])
			.where("key", "=", "server_version")
			.executeTakeFirst()
			.then((row) => row?.value ?? null)
	}
}