import './app.css'
import App from './App.svelte'
import request from "superagent"


interface Window {
	Config: any
	Request: any

	getAccessToken: () => { token: string, expiresAt?: string }
	setAccessToken: (token: string, expiresAt?: string) => void

	getRefreshToken: () => { token: string, expiresAt?: string }
	setRefreshToken: (token: string, expiresAt?: string) => void

	log?: (payload: any) => void
}

declare var window: Window

window.Config = {
	apiBaseUrl: 'http://localhost:4000/api/v1'
}

// Support all HTTP methods with a simple Request function
window.Request = async (params: any = {}) => {
	const baseUrl = window.Config.apiBaseUrl
	const method = (params.method || 'GET').toUpperCase()
	const path = params.path || '/'
	const query = params.params || {}
	const body = params.body || {}
	const headers = params.headers || {}
	const tokenInfo = window.getAccessToken()
	const token = tokenInfo.token

	const req = request(method, `${baseUrl}${path}`)
	if (token) req.set('Authorization', `Bearer ${token}`)
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
	const payload = { ok, status: res.status, body: parsedBody, raw: res }

	// Automatically detect and store new tokens from response headers
	const newAccessToken = parsedBody?.data?.tokens?.access || null
	const newRefreshToken = parsedBody?.data?.tokens?.refresh || null
	if (newAccessToken?.token) window.setAccessToken(newAccessToken.token, newAccessToken.expiresAt)
	if (newRefreshToken?.token) window.setRefreshToken(newRefreshToken.token, newRefreshToken.expiresAt)

	if (typeof window.log === 'function') window.log(payload)
	return payload
}

window.setAccessToken = (token: string, expiresAt?: string) => {
	localStorage.setItem('apiTester.accessToken', token)
	if (expiresAt) {
		localStorage.setItem('apiTester.accessTokenExpiresAt', expiresAt)
	}
	else {
		localStorage.removeItem('apiTester.accessTokenExpiresAt')
	}
}

window.getAccessToken = () => {
	return {
		token: localStorage.getItem('apiTester.accessToken') ?? "",
		expiresAt: localStorage.getItem('apiTester.accessTokenExpiresAt') ?? ""
	}
}

window.setRefreshToken = (token: string, expiresAt?: string) => {
	localStorage.setItem('apiTester.refreshToken', token)
	if (expiresAt) {
		localStorage.setItem('apiTester.refreshTokenExpiresAt', expiresAt)
	}
	else {
		localStorage.removeItem('apiTester.refreshTokenExpiresAt')
	}
}

window.getRefreshToken = () => {
	return {
		token: localStorage.getItem('apiTester.refreshToken') ?? "",
		expiresAt: localStorage.getItem('apiTester.refreshTokenExpiresAt') ?? ""
	}
}


const target = document.getElementById('app') as HTMLElement

new App({ target })
