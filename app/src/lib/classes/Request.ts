import superagent from 'superagent'
import { PUBLIC_API_URL } from '$env/static/public'
import type { HttpMethod, RequestOptions } from '../types/types'

type InternalOptions = RequestOptions & {
	headers?: Record<string, string>
	allowRefresh?: boolean
}

const getApp = () => (globalThis as any).app

export class RequestClient {
	private readonly apiBase = PUBLIC_API_URL || 'http://localhost:4000/api/v1'

	private resolveToken() {
		const direct = app.Auth.getAccessToken()

		if (direct) return direct
		if (typeof document !== 'undefined') {
			const cookies = document.cookie?.split(';').map((c) => c.trim()) ?? []
			const map = Object.fromEntries(
				cookies
					.map((entry) => entry.split('='))
					.filter((pair) => pair.length === 2)
					.map(([k, v]) => [k, decodeURIComponent(v)])
			)
			return map.accessToken || map.token || map.authToken || null
		}
		return null
	}

	private async refreshSession() {
		return getApp().Auth.refresh()
	}

	private async attempt<T>(
		method: HttpMethod,
		url: string,
		options: InternalOptions,
		attachAuth = true
	) {
		let req = superagent[method](url)
		if (options.query) {
			req = req.query(options.query)
		}
		if (attachAuth && options.useAuth !== false) {
			const token = this.resolveToken()
			if (token) {
				req = req.set('Authorization', `Bearer ${token}`)
			}
		}
		if (options.headers) {
			req = req.set(options.headers)
		}
		if (options.body) {
			req = req.send(options.body)
		}
		const response = await req.accept('application/json')
		return (response.body?.data ?? response.body) as T
	}

	async call<T>(method: HttpMethod, path: string, options: InternalOptions = {}) {
		const normalizedPath = path.startsWith('/') ? path : `/${path}`
		const url = `${this.apiBase}${normalizedPath}`
		const allowRefresh = options.allowRefresh !== false

		try {
			return await this.attempt<T>(method, url, options, true)
		} catch (error: any) {
			const status = error?.status ?? error?.response?.status
			if (options.useAuth !== false && allowRefresh && status === 401) {
				const refreshed = await this.refreshSession()
				if (refreshed) {
					return await this.attempt<T>(method, url, options, true)
				}
			}
			throw error
		}
	}

	get<T>(path: string, options: InternalOptions = {}) {
		return this.call<T>('get', path, options)
	}

	post<T>(path: string, options: InternalOptions = {}) {
		return this.call<T>('post', path, options)
	}

	put<T>(path: string, options: InternalOptions = {}) {
		return this.call<T>('put', path, options)
	}

	delete<T>(path: string, options: InternalOptions = {}) {
		return this.call<T>('delete', path, options)
	}
}
