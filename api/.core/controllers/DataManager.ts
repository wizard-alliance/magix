import superagent from 'superagent'
import { createHash } from "crypto"
import { SettingsData } from "./Data/Settings.js"
import { format, isWeekend } from "date-fns"

import type { TableMap } from "../schema/Database.js"

export type SharedDataDependencies = {
	tables: TableMap
	setCache: (key: any, value: any, cachetime?: number) => void
	getCache: (key: any) => any
	applyWhere: (query: any, params: Record<string, any>) => any
	applyOptions: (query: any, options: Record<string, any>) => any
	createUrl: (path: string) => string
}

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
	private readonly cacheMaxAge = 5 // XX minutes
	private readonly prefix = "DataManager"
	private sessionCache: Map<string, CacheEntry> = new Map()
	public readonly settings: SettingsData

	constructor() {
		const shared = {
			setCache: this.setCache.bind(this),
			getCache: this.getCache.bind(this),
			applyWhere: this.applyWhere.bind(this),
			applyOptions: this.applyOptions.bind(this),
			createUrl: this.createUrl.bind(this),
		}

		this.settings = new SettingsData(shared)
	}

	setCache(keyRaw: any, value: any, cachetime: number = this.cacheMaxAge): void {
		const key = typeof keyRaw === 'string' ? keyRaw : JSON.stringify(keyRaw)
		const data = this.cloneValue(value)
		const __cache_hash = this.generateHash(data)
		const __cache_timestamp = Date.now() + (cachetime * 60 * 1000)

		this.sessionCache.set(key, { data, __cache_hash, __cache_timestamp })
	}

	// Maybe get cache, if it exists and hash is identical
	getCache(keyRaw: any): any | undefined {
		const key = typeof keyRaw === 'string' ? keyRaw : JSON.stringify(keyRaw)
		let returnCache = false
		const cachedValue = this.sessionCache.get(key)
		if (!cachedValue) {
			return undefined
		}
		const { data, __cache_hash, __cache_timestamp } = cachedValue
		const hashKey = this.generateHash(data)

		// Check cache existence and validity
		if (data && __cache_hash === hashKey) {
			returnCache = true
		}

		// Check age of cache
		if (returnCache && __cache_timestamp) {
			const now = Date.now()
			if (now > __cache_timestamp) {
				api.Log(`Cache expired for key: ${key}`, this.prefix)
				returnCache = false
			}
		}

		if (returnCache) {
			const cloned = this.cloneValue(data)
			if (cloned && typeof cloned === 'object') {
				Object.defineProperty(cloned, '__CACHE', {
					value: {
						key,
						hash: __cache_hash,
						fetchedFromCache: true,
						fetchedAt: Date.now(),
						cachedAt: __cache_timestamp,
					},
					enumerable: false,
				})
			}
			return cloned
		}

		this.sessionCache.delete(key)
		return undefined
	}

	clearCache(keyRaw: any): void {
		const key = typeof keyRaw === 'string' ? keyRaw : JSON.stringify(keyRaw)
		this.sessionCache.delete(key)
	}

	clearAllCache(): void {
		this.sessionCache.clear()
	}

	generateHash(input: any): string {
		const hash = createHash('sha256')
		hash.update(JSON.stringify(input))
		return hash.digest('hex')
	}

	private cloneValue<T>(input: T): T {
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

	private createUrl(path: string): string {
		const uploadDir = `static/${api.Config('UPLOAD_DIR') || 'uploads'}`
		const baseUrl = api.Config("API_BASE_URL")
		const filePath = `${uploadDir}/${path}`
		const url = `${baseUrl}/${filePath}`

		// Gently nudge for upload dir config
		if (!api.Config('UPLOAD_DIR')) { api.Warning(`Upload directory not configured`, this.prefix) }

		return url
	}

	private applyWhere(q: any, params: Record<string, any>) {
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

	private applyOptions(query: any, options: Record<string, any>) {
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