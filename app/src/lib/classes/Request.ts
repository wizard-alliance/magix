import superagent from 'superagent'
import { PUBLIC_API_URL } from '$env/static/public'
import type { HttpMethod, RequestOptions } from '../types/types'

type InternalOptions = RequestOptions & {
	headers?: Record<string, string>
	allowRefresh?: boolean
}

export class RequestClient {
	private readonly apiBase = PUBLIC_API_URL || 'http://localhost:4000/api/v1'

	/**
	 * Resolve bearer token from Auth
	 */
	private resolveToken(): string | null {
		return (globalThis as any).app?.Auth?.getAccessToken?.() ?? null
	}

	/**
	 * Attempt token refresh via Auth
	 */
	private async refreshSession() {
		return (globalThis as any).app?.Auth?.refresh?.()
	}

	/**
	 * Execute HTTP request
	 */
	private async attempt<T>(method: HttpMethod, url: string, options: InternalOptions, attachAuth = true): Promise<T> {
		let req = superagent[method](url)
		if (options.query) req = req.query(options.query)
		if (attachAuth && options.useAuth !== false) {
			const token = this.resolveToken()
			if (token) req = req.set('Authorization', `Bearer ${token}`)
		}
		if (options.headers) req = req.set(options.headers)
		if (options.body) req = req.send(options.body)
		const response = await req.accept('application/json')
		return (response.body?.data ?? response.body) as T
	}

	/**
	 * Extract error message from API response
	 */
	private extractErrorMessage(error: any): string {
		const body = error?.response?.body
		return body?.errorMessage ?? body?.error ?? body?.message ?? error?.message ?? 'An unexpected error occurred'
	}

	/**
	 * Make API call with auto-refresh on 401
	 */
	async call<T = any>(method: HttpMethod, path: string, options: InternalOptions = {}): Promise<T> {
		const url = `${this.apiBase}${path.startsWith('/') ? path : `/${path}`}`
		const allowRefresh = options.allowRefresh !== false

		try {
			return await this.attempt<T>(method, url, options, true)
		} catch (error: any) {
			const status = error?.status ?? error?.response?.status
			if (options.useAuth !== false && allowRefresh && status === 401) {
				const refreshed = await this.refreshSession()
				if (refreshed) return await this.attempt<T>(method, url, options, true)
			}
			throw new Error(this.extractErrorMessage(error))
		}
	}

	get<T = any>(path: string, options: InternalOptions = {}) {
		return this.call<T>('get', path, options)
	}

	post<T = any>(path: string, options: InternalOptions = {}) {
		return this.call<T>('post', path, options)
	}

	put<T = any>(path: string, options: InternalOptions = {}) {
		return this.call<T>('put', path, options)
	}

	delete<T = any>(path: string, options: InternalOptions = {}) {
		return this.call<T>('delete', path, options)
	}

	/**
	 * Upload a file via multipart/form-data
	 */
	async upload<T = any>(path: string, file: File, fieldName = 'file', extra?: Record<string, string>): Promise<T> {
		const url = `${this.apiBase}${path.startsWith('/') ? path : `/${path}`}`

		const doUpload = async (): Promise<T> => {
			let req = superagent.post(url)
			const token = this.resolveToken()
			if (token) req = req.set('Authorization', `Bearer ${token}`)
			req = req.attach(fieldName, file as any, file.name)
			if (extra) {
				for (const [k, v] of Object.entries(extra)) req = req.field(k, v)
			}
			const response = await req
			return (response.body?.data ?? response.body) as T
		}

		try {
			return await doUpload()
		} catch (error: any) {
			const status = error?.status ?? error?.response?.status
			if (status === 401) {
				const refreshed = await this.refreshSession()
				if (refreshed) return await doUpload()
			}
			throw new Error(this.extractErrorMessage(error))
		}
	}
}
