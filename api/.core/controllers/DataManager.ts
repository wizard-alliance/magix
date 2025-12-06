import { createHash } from "crypto"
import { CrudMethods } from "./Data/CrudMethods.js"
import { CacheMethods } from "./Data/CacheMethods.js"

/**
 * Handles data management operations. 
 * One centralized source for building of data structures.
 */
type CacheEntry = {
	data: any
	__cache_hash: string
	__cache_timestamp: number
}

export class DataManager {
	public readonly prefix = "DataManager"
	public readonly CRUD: CrudMethods = new CrudMethods()
	public readonly Cache: CacheMethods = new CacheMethods()

	public generateHash(input: any): string {
		const hash = createHash('sha256')
		hash.update(JSON.stringify(input))
		return hash.digest('hex')
	}

	public cloneValue<T>(input: T): T {
		if (input === null || typeof input !== 'object') {
			return input
		}
		if (Array.isArray(input)) {
			return input.map((item) => this.cloneValue(item)) as unknown as T
		}
		if (input instanceof Date) {
			return new Date(input.getTime()) as unknown as T
		}
		if (input instanceof Map) {
			return new Map(Array.from(input.entries()).map(([key, value]) => [key, this.cloneValue(value)])) as unknown as T
		}
		if (input instanceof Set) {
			return new Set(Array.from(input.values()).map((value) => this.cloneValue(value))) as unknown as T
		}
		const cloned: Record<string, any> = {}
		for (const [key, value] of Object.entries(input as Record<string, any>)) {
			cloned[key] = this.cloneValue(value)
		}
		return cloned as T
	}

	public applyWhere(q: any, params: Record<string, any>) {
		for (const [k, v] of Object.entries(params)) {
			if (v === undefined) continue
			if (Array.isArray(v)) {
				if (!v.length) continue
				q = q.where(k as any, "in", v as any)
				continue
			}

			if (v === null) {
				q = q.where(k as any, "is", null)
				continue
			}

			q = q.where(k as any, "=", v as any)
		}

		return q
	}

	public applyOptions(query: any, options: Record<string, any>) {
		if (options.limit) { query = query.limit(options.limit) }
		if (options.orderBy) { query = query.orderBy(options.orderBy) }
		if (options.offset) { query = query.offset(options.offset) }

		const applySort = (sortValue: any) => {
			if (!sortValue) return
			if (Array.isArray(sortValue)) {
				sortValue.forEach(entry => applySort(entry))
				return
			}
			if (typeof sortValue === "string") {
				query = query.orderBy(sortValue)
				return
			}
			if (typeof sortValue === "object" && typeof sortValue.column === "string") {
				const direction = typeof sortValue.order === "string" ? sortValue.order : undefined
				query = direction ? query.orderBy(sortValue.column, direction) : query.orderBy(sortValue.column)
			}
		}

		if (options.sort) {
			applySort(options.sort)
		}

		return query
	}
	
}