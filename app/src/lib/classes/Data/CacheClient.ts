const isBrowser = typeof window !== 'undefined'
const STORAGE_PREFIX = `__cache:`
const VERSION_KEY = `${STORAGE_PREFIX}version`

type CacheEntry<T = any> = {
	data: T
	expires: number
}

type CacheVersionResponse = {
	version: string
	lastCleared: string | null
}

type CacheStatusResponse = CacheVersionResponse & {
	apiCacheSize: number
}

type CacheClearResponse = {
	success: boolean
	target: string
	version: string
	lastCleared: string
}

export class CacheClient {
	private readonly prefix = `CacheClient`
	private readonly defaultTTL = 10 // minutes
	private memory: Map<string, CacheEntry> = new Map()

	// localStorage helpers

	private storageGet(key: string): string | null {
		if (!isBrowser) return null
		try { return localStorage.getItem(key) } catch { return null }
	}

	private storageSet(key: string, value: string): void {
		if (!isBrowser) return
		try { localStorage.setItem(key, value) } catch { /* quota exceeded */ }
	}

	private storageRemove(key: string): void {
		if (!isBrowser) return
		try { localStorage.removeItem(key) } catch {}
	}

	private storageKey(key: string): string {
		return `${STORAGE_PREFIX}${key}`
	}

	// Core cache operations

	get<T = any>(key: string): T | undefined {
		const sKey = this.storageKey(key)
		const now = Date.now()

		// Check memory first
		const memEntry = this.memory.get(sKey)
		if (memEntry) {
			if (now < memEntry.expires) return memEntry.data as T
			this.memory.delete(sKey)
		}

		// Fall back to localStorage
		const raw = this.storageGet(sKey)
		if (!raw) return undefined

		try {
			const entry: CacheEntry = JSON.parse(raw)
			if (now < entry.expires) {
				// Rehydrate into memory
				this.memory.set(sKey, entry)
				return entry.data as T
			}
		} catch {}

		// Expired or corrupt
		this.storageRemove(sKey)
		return undefined
	}

	set<T = any>(key: string, value: T, ttlMinutes: number = this.defaultTTL): void {
		const sKey = this.storageKey(key)
		const entry: CacheEntry<T> = {
			data: value,
			expires: Date.now() + (ttlMinutes * 60 * 1000),
		}

		this.memory.set(sKey, entry)

		try {
			this.storageSet(sKey, JSON.stringify(entry))
		} catch { /* non-serializable or quota — memory-only is fine */ }
	}

	clear(key: string): void {
		const sKey = this.storageKey(key)
		this.memory.delete(sKey)
		this.storageRemove(sKey)
	}

	clearAll(): void {
		this.memory.clear()

		if (!isBrowser) return
		try {
			const keysToRemove: string[] = []
			for (let i = 0; i < localStorage.length; i++) {
				const k = localStorage.key(i)
				if (k?.startsWith(STORAGE_PREFIX) && k !== VERSION_KEY) {
					keysToRemove.push(k)
				}
			}
			keysToRemove.forEach(k => localStorage.removeItem(k))
		} catch {}
	}

	size(): { memory: number, storage: number } {
		let storageCount = 0
		if (isBrowser) {
			try {
				for (let i = 0; i < localStorage.length; i++) {
					const k = localStorage.key(i)
					if (k?.startsWith(STORAGE_PREFIX) && k !== VERSION_KEY) storageCount++
				}
			} catch {}
		}
		return { memory: this.memory.size, storage: storageCount }
	}

	// Version check — call on app init

	async checkVersion(): Promise<{ version: string, lastCleared: string | null, wasCleared: boolean }> {
		try {
			const remote = await app.System.Request.get<CacheVersionResponse>(`/cache/version`, { useAuth: false })
			const storedVersion = this.storageGet(VERSION_KEY)
			let wasCleared = false

			if (storedVersion && storedVersion !== remote.version) {
				this.clearAll()
				wasCleared = true
				console.log(`${this.prefix}: cache version mismatch (local=${storedVersion}, remote=${remote.version}) — cleared all`)
			}

			this.storageSet(VERSION_KEY, remote.version)

			return { version: remote.version, lastCleared: remote.lastCleared, wasCleared }
		} catch (error) {
			console.warn(`${this.prefix}: failed to check cache version`, error)
			return { version: '0', lastCleared: null, wasCleared: false }
		}
	}

	// Admin operations

	async adminClear(target: 'api' | 'browser' | 'all' = 'all'): Promise<CacheClearResponse | null> {
		try {
			const result = await app.System.Request.post<CacheClearResponse>(`/cache/clear`, { body: { target } })

			// If browser or all, update local version to match
			if (target === 'browser' || target === 'all') {
				this.clearAll()
				if (result?.version) this.storageSet(VERSION_KEY, result.version)
			}

			return result
		} catch (error) {
			console.error(`${this.prefix}: failed to clear cache`, error)
			return null
		}
	}

	async adminStatus(): Promise<CacheStatusResponse | null> {
		try {
			return await app.System.Request.get<CacheStatusResponse>(`/cache/status`)
		} catch (error) {
			console.warn(`${this.prefix}: failed to get cache status`, error)
			return null
		}
	}
}
