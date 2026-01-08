// import { app } from '../../app.js'
import { LocalStorageClient } from '../Data/LocalStorageClient'
import type { AuthPayload, UserDBRow } from '../../types/types'

type LoginInput = {
	identifier?: string
	email?: string
	username?: string
	password?: string
}

type RegisterInput = {
	email?: string
	username?: string
	password?: string
	firstName?: string
	lastName?: string
	tosAccepted?: boolean
}

type VendorPayload = Record<string, any>

export class AuthClient {
	private readonly storage = new LocalStorageClient()
	private readonly keys = {
		access: 'auth_access_token',
		refresh: 'auth_refresh_token',
		user: 'auth_user',
		refreshExpires: 'auth_refresh_expires',
	}

	private updateUser(user: UserDBRow | null) {
		const store = app.State.currentUser
		if (store && typeof store.set === 'function') {
			store.set(user)
		}
	}

	private persistSession(payload: AuthPayload) {
		this.storage.setItem(this.keys.access, payload.tokens.access.token)
		this.storage.setItem(this.keys.refresh, payload.tokens.refresh.token)
		this.storage.setItem(this.keys.refreshExpires, payload.tokens.refresh.expiresAt.toString())
		this.storage.setItem(this.keys.user, JSON.stringify(payload.user))
		this.updateUser(payload.user)
	}

	private clearSession() {
		this.storage.remove(this.keys.access)
		this.storage.remove(this.keys.refresh)
		this.storage.remove(this.keys.refreshExpires)
		this.storage.remove(this.keys.user)
		this.updateUser(null)
	}

	private async call<T = any>(
		method: 'get' | 'post',
		path: string,
		body?: Record<string, any>,
		useAuth = true,
		allowRefresh = true
	) {
		try {
			return await app.Request.call(method, path, {
				body,
				useAuth,
				allowRefresh,
			})
		} catch (error) {
			app.$.Error((error as Error).message, 'AuthClient')
			throw error
		}
	}

	getAccessToken() {
		return this.storage.getItem(this.keys.access)
	}

	getRefreshToken() {
		return this.storage.getItem(this.keys.refresh)
	}

	getStoredUser(): UserDBRow | null {
		const raw = this.storage.getItem(this.keys.user)
		if (!raw) {
			return null
		}
		try {
			return JSON.parse(raw) as UserDBRow
		} catch {
			return null
		}
	}

	async login(payload: LoginInput) {
		const data = await this.call<AuthPayload>('post', '/auth/login', payload, false)
		if (data) {
			this.persistSession(data)
		}
		return data
	}

	async register(payload: RegisterInput) {
		const data = await this.call<AuthPayload>('post', '/auth/register', payload, false)
		if (data) {
			this.persistSession(data)
		}
		return data
	}

	async me() {
		const token = this.getAccessToken()
		if (!token) {
			return null
		}
		const data = await this.call<{ user: UserDBRow }>('get', '/auth/me')
		if (data?.user) {
			this.updateUser(data.user)
			this.storage.setItem(this.keys.user, JSON.stringify(data.user))
			return data.user
		}
		return null
	}

	async refresh() {
		const refreshToken = this.getRefreshToken()
		if (!refreshToken) {
			return null
		}
		try {
			const data = await this.call<AuthPayload>(
				'post',
				'/auth/refresh',
				{ refreshToken },
				false,
				false
			)
			if (data) {
				this.persistSession(data)
			}
			return data
		} catch (error) {
			this.clearSession()
			return null
		}
	}

	async logout() {
		const refreshToken = this.getRefreshToken()
		if (refreshToken) {
			await this.call('post', '/auth/logout', { refreshToken }).catch(() => null)
		}
		this.clearSession()
	}

	async logoutAllDevices() {
		await this.call('post', '/auth/logout/all-devices', {}, true).catch(() => null)
		this.clearSession()
	}

	async logoutAllUsers() {
		return this.call('post', '/auth/logout/all-users', {}, false)
	}

	async changePassword(currentPassword: string, newPassword: string, logoutAll = true) {
		return this.call('post', '/auth/password', { currentPassword, newPassword, logoutAll })
	}

	async updateProfile(body: Record<string, any>) {
		return this.call('post', '/auth/profile', body)
	}

	async vendor(vendor: string) {
		return this.call('get', `/auth/vendor/${vendor}`, undefined, false)
	}

	async vendorLogin(vendor: string, payload: VendorPayload) {
		const data = await this.call<AuthPayload>('post', `/auth/vendor/${vendor}`, payload, false)
		if (data) {
			this.persistSession(data)
		}
		return data
	}

	restore() {
		const storedUser = this.storage.getItem(this.keys.user)
		if (storedUser) {
			try {
				this.updateUser(JSON.parse(storedUser))
			} catch {
				this.updateUser(null)
			}
		}

		if (this.getAccessToken()) {
			this.me().catch(() => null)
			return
		}

		if (this.getRefreshToken()) {
			this.refresh().catch(() => null)
		}
	}
}
