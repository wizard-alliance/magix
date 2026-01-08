import type { HttpMethod, RequestOptions } from '../../types/types'

const ensurePath = (path: string) => path.startsWith('/') ? path : `/${path}`
const isPlainObject = (value: unknown): value is Record<string, any> => Object.prototype.toString.call(value) === '[object Object]'
const toSnakeCase = (value: string) => {
	if (!value.length || /^[A-Z0-9_]+$/.test(value)) {
		return value
	}
	return value
		.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
		.replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
		.toLowerCase()
}
const normalizeObjectKeys = (input: Record<string, any>): Record<string, any> => Object.fromEntries(
	Object.entries(input).map(([key, value]) => {
		const normalizedKey = toSnakeCase(key)
		if (Array.isArray(value)) {
			return [normalizedKey, value.map((entry) => isPlainObject(entry) ? normalizeObjectKeys(entry) : entry)]
		}
		if (isPlainObject(value)) {
			return [normalizedKey, normalizeObjectKeys(value)]
		}
		return [normalizedKey, value]
	})
)

export class BaseResource<TSingle, TCollection = TSingle> {
	constructor(
		private readonly resourceName: string,
		private readonly pluralName: string = `${resourceName}s`
	) { }

	protected request<T>(method: HttpMethod, path: string, options: RequestOptions = {}) {
		return app.Request.call(method, ensurePath(path), options)
	}

	protected normalizeQuery(query?: Record<string, any> | number | string | null) {
		if (typeof query === 'number' && Number.isFinite(query)) {
			return { ID: query }
		}
		if (typeof query === 'string' && query.trim().length) {
			return { ID: query }
		}
		if (query && typeof query === 'object') {
			return normalizeObjectKeys(query as Record<string, any>)
		}
		return undefined
	}

	protected normalizeBody(body?: Record<string, any> | null) {
		if (!body || typeof body !== 'object') {
			return undefined
		}
		return normalizeObjectKeys(body)
	}

	async get(query?: Record<string, any> | number | string | null): Promise<TSingle | null> {
		const normalized = this.normalizeQuery(query)
		const data = await this.request<TSingle | null>('get', this.resourceName, { query: normalized })
		return data ?? null
	}

	async list(query?: Record<string, any>): Promise<TCollection[]> {
		const normalized = query ? this.normalizeQuery(query) : undefined
		const data = await this.request<TCollection[] | null>('get', this.pluralName, { query: normalized })
		return Array.isArray(data) ? data : []
	}

	async create(body: Record<string, any>): Promise<any> {
		const normalized = this.normalizeBody(body) ?? body
		return this.request<any>('post', this.resourceName, { body: normalized })
	}

	async update(query: Record<string, any>, body: Record<string, any>): Promise<any> {
		const normalized = this.normalizeQuery(query) ?? query
		const normalizedBody = this.normalizeBody(body) ?? body
		return this.request<any>('put', this.resourceName, { query: normalized, body: normalizedBody })
	}

	async remove(query: Record<string, any>): Promise<any> {
		const normalized = this.normalizeQuery(query) ?? query
		return this.request<any>('delete', this.resourceName, { query: normalized })
	}
}