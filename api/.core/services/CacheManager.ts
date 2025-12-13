type CacheEntry = {
	data: any
	__cache_hash: string
	__cache_timestamp: number
}

export class CacheManager {
	private get prefix() { return `Cache` }
	private readonly cacheMaxAge = 5
	private sessionCache: Map<string, CacheEntry> = new Map()

	public set(keyRaw: any, value: any, cachetime: number = this.cacheMaxAge): void {
		const key = typeof keyRaw === 'string' ? keyRaw : JSON.stringify(keyRaw)
		const data = api.Utils.cloneValue(value)
		const __cache_hash = api.Utils.generateHash(data)
		const __cache_timestamp = Date.now() + (cachetime * 60 * 1000)

		this.sessionCache.set(key, { data, __cache_hash, __cache_timestamp })
	}

	public get(keyRaw: any): any | undefined {
		const key = typeof keyRaw === 'string' ? keyRaw : JSON.stringify(keyRaw)
		let returnCache = false
		const cachedValue = this.sessionCache.get(key)
		if (!cachedValue) {
			return undefined
		}
		const { data, __cache_hash, __cache_timestamp } = cachedValue
		const hashKey = api.Utils.generateHash(data)

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
			const cloned = api.Utils.cloneValue(data)
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

	public clear(keyRaw: any): void {
		const key = typeof keyRaw === 'string' ? keyRaw : JSON.stringify(keyRaw)
		this.sessionCache.delete(key)
	}

	public clearAll(): void {
		this.sessionCache.clear()
	}
}