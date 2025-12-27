import request from 'superagent'
import { browser } from '$app/environment'

export type TokenInfo = { token: string; expiresAt?: string }

const accessKey = 'apiTester.accessToken'
const accessExpKey = 'apiTester.accessTokenExpiresAt'
const refreshKey = 'apiTester.refreshToken'
const refreshExpKey = 'apiTester.refreshTokenExpiresAt'

export const setAccessToken = (token: string, expiresAt?: string) => {
	if (!browser) return
	localStorage.setItem(accessKey, token)
	expiresAt ? localStorage.setItem(accessExpKey, expiresAt) : localStorage.removeItem(accessExpKey)
}

export const getAccessToken = (): TokenInfo => {
	if (!browser) return { token: '', expiresAt: '' }
	return {
		token: localStorage.getItem(accessKey) ?? '',
		expiresAt: localStorage.getItem(accessExpKey) ?? ''
	}
}

export const setRefreshToken = (token: string, expiresAt?: string) => {
	if (!browser) return
	localStorage.setItem(refreshKey, token)
	expiresAt ? localStorage.setItem(refreshExpKey, expiresAt) : localStorage.removeItem(refreshExpKey)
}

export const getRefreshToken = (): TokenInfo => {
	if (!browser) return { token: '', expiresAt: '' }
	return {
		token: localStorage.getItem(refreshKey) ?? '',
		expiresAt: localStorage.getItem(refreshExpKey) ?? ''
	}
}

export const initApi = ({ baseUrl, onLog }: { baseUrl: string; onLog?: (payload: any) => void }) => {
	if (!browser) return

	window.Config = { apiBaseUrl: baseUrl }
	window.getAccessToken = getAccessToken
	window.setAccessToken = setAccessToken
	window.getRefreshToken = getRefreshToken
	window.setRefreshToken = setRefreshToken
	if (onLog) window.log = onLog

	window.Request = async (params: any = {}) => {
		const method = (params.method || 'GET').toUpperCase()
		const path = params.path || '/'
		const query = params.params || {}
		const body = params.body || {}
		const headers = params.headers || {}
		const accessTokenInfo = getAccessToken()
		const accessToken = accessTokenInfo.token


		const req = request(method, `${baseUrl}${path}`)
		if (accessToken) req.set('Authorization', `Bearer ${accessToken}`)
		Object.entries(headers).forEach(([key, value]) => {
			if (value) req.set(key, value as string)
		})
		req.accept('application/json').ok(() => true)
		if (method === 'GET' || method === 'HEAD') {
			req.query(query)
		} else {
			req.send(body)
		}

		const res = await req
		const parsedBody = res.body ?? (res.text ? JSON.parse(res.text) : {})
		const ok = typeof res.status === 'number' ? res.status < 400 : true
		const payload = { ok, status: res.status, body: parsedBody, raw: res, path, method }

		const newAccess = parsedBody?.data?.tokens?.access
		const newRefresh = parsedBody?.data?.tokens?.refresh
		if (newAccess?.token) setAccessToken(newAccess.token, newAccess.expiresAt)
		if (newRefresh?.token) setRefreshToken(newRefresh.token, newRefresh.expiresAt)

		if (typeof window.log === 'function') window.log(payload)
		if (onLog) onLog(payload)
		return payload
	}
}
