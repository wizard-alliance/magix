import type { AuthPayload, UserDBRow, UserFull, UserVendorLink } from '../../types/types'

type LoginInput = { identifier: string; password: string; remember?: boolean }
type RegisterInput = { email: string; username: string; password: string; tos_accepted?: boolean }

const IS_SECURE = typeof location !== 'undefined' && location.protocol === 'https:'
const COOKIE_OPTS = `path=/; SameSite=Strict${IS_SECURE ? '; Secure' : ''}`
const isBrowser = typeof document !== 'undefined'

export class AuthClient {
	ready: Promise<void> = Promise.resolve()

	private keys = {
		access: 'auth_access_token',
		refresh: 'auth_refresh_token',
		remember: 'auth_remember',
	}

	/**
	 * Set a secure cookie (session cookie if days=0)
	 */
	private setCookie(name: string, value: string, days?: number) {
		if (!isBrowser) return
		if (days && days > 0) {
			const expires = new Date(Date.now() + days * 864e5).toUTCString()
			document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; ${COOKIE_OPTS}`
		} else {
			// Session cookie - no expires means it's deleted when browser closes
			document.cookie = `${name}=${encodeURIComponent(value)}; ${COOKIE_OPTS}`
		}
	}

	/**
	 * Get a cookie value
	 */
	private getCookie(name: string): string | null {
		if (!isBrowser) return null
		const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
		return match ? decodeURIComponent(match[1]) : null
	}

	/**
	 * Delete a cookie
	 */
	private deleteCookie(name: string) {
		if (!isBrowser) return
		document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${COOKIE_OPTS}`
	}

	/**
	 * Check if "remember me" is enabled
	 */
	private isRemembered(): boolean {
		return this.getCookie(this.keys.remember) === '1'
	}

	/**
	 * Update current user in app state
	 */
	private updateUser(user: UserDBRow | UserFull | null) {
		app.State.currentUser?.set?.(user)
	}

	/**
	 * Persist session tokens and user data
	 */
	private persistSession(payload: AuthPayload, remember = false) {
		const { tokens, user } = payload
		app.Cache.clear('auth:me')
		if (remember) {
			this.setCookie(this.keys.remember, '1', 30)
			this.setCookie(this.keys.access, tokens.access.token, 7)
			this.setCookie(this.keys.refresh, tokens.refresh.token, 30)
		} else {
			this.deleteCookie(this.keys.remember)
			this.setCookie(this.keys.access, tokens.access.token) // session cookie
			this.setCookie(this.keys.refresh, tokens.refresh.token) // session cookie
		}
		this.updateUser(user)
	}

	/**
	 * Clear stored session data
	 */
	private clearSession() {
		app.Cache.clear('auth:me')
		this.deleteCookie(this.keys.access)
		this.deleteCookie(this.keys.refresh)
		this.deleteCookie(this.keys.remember)
		this.updateUser(null)
	}

	/**
	 * Get the current access token
	 */
	getAccessToken(): string | null {
		return this.getCookie(this.keys.access)
	}

	/**
	 * Get the current refresh token
	 */
	getRefreshToken(): string | null {
		return this.getCookie(this.keys.refresh)
	}

	/**
	 * Check if user is logged in (has valid tokens)
	 */
	isLoggedIn(): boolean {
		return !!this.getAccessToken()
	}

	/**
	 * Login with identifier (email/username) and password
	 */
	async login(payload: LoginInput) {
		const { remember, ...body } = payload
		const fp = await app.System.Fingerprint.get()
		const data = await app.System.Request.post<AuthPayload>('/account/auth/login', {
			body: { ...body, fingerprint: fp.fingerprint, device_name: fp.deviceName },
			useAuth: false,
		})
		if (data) this.persistSession(data, remember)
		return data
	}

	/**
	 * Register a new account (requires email activation before login)
	 */
	async register(payload: RegisterInput) {
		return app.System.Request.post<{ success: boolean; message: string }>('/auth/register', {
			body: payload,
			useAuth: false,
		})
	}

	/**
	 * Get current authenticated user profile
	 */
	async me(force = false): Promise<UserFull | null> {
		const token = this.getAccessToken()
		if (!token) return null

		if (!force) {
			const cached = app.Cache.get<UserFull>('auth:me')
			if (cached) {
				this.updateUser(cached)
				return cached
			}
		}

		try {
			const data = await app.System.Request.post<UserFull>('/account/me')
			if (data && !('error' in data)) {
				app.Cache.set('auth:me', data, 10)
				this.updateUser(data)
				return data
			}
			return null
		} catch {
			return null
		}
	}

	/**
	 * Refresh access token using refresh token
	 */
	async refresh() {
		const refreshToken = this.getRefreshToken()
		if (!refreshToken) return null
		try {
			const remember = this.isRemembered()
			const data = await app.System.Request.post<AuthPayload>('/account/auth/refresh', {
				body: { refresh_token: refreshToken },
				useAuth: false,
				allowRefresh: false,
			})
			if (data) this.persistSession(data, remember)
			return data
		} catch {
			this.clearSession()
			return null
		}
	}

	/**
	 * Logout current session
	 */
	async logout() {
		const refreshToken = this.getRefreshToken()
		if (refreshToken) {
			await app.System.Request.post('/account/auth/logout', {
				body: { refresh_token: refreshToken },
			}).catch(() => null)
		}
		this.clearSession()
	}

	/**
	 * Logout from all devices
	 */
	async logoutAllDevices() {
		await app.System.Request.post('/account/auth/logout/all-devices').catch(() => null)
		this.clearSession()
	}

	/**
	 * Logout a specific device by ID
	 */
	async logoutDevice(deviceId: number) {
		await app.System.Request.post(`/account/auth/logout/device/${deviceId}`)
	}

	/**
	 * Delete a device (revokes tokens and removes the device row)
	 */
	async deleteDevice(deviceId: number) {
		await app.System.Request.post(`/account/device/${deviceId}/delete`)
	}

	/**
	 * Rename a device (set custom_name)
	 */
	async renameDevice(deviceId: number, customName: string) {
		return app.System.Request.post(`/account/device/${deviceId}/name`, {
			body: { custom_name: customName },
		})
	}

	/**
	 * Update the current device with fingerprint info (used after OAuth callback)
	 */
	async updateCurrentDevice() {
		const fp = await app.System.Fingerprint.get()
		if (!fp.fingerprint) return
		return app.System.Request.post('/account/device', {
			body: { fingerprint: fp.fingerprint, device_name: fp.deviceName },
		})
	}

	/**
	 * Change account password
	 */
	async changePassword(currentPassword: string, newPassword: string, logoutAll = true) {
		return app.System.Request.post('/account/auth/password', {
			body: { current_password: currentPassword, new_password: newPassword, logout_all: logoutAll },
		})
	}

	/**
	 * Update user profile
	 */
	async updateProfile(body: Record<string, any>) {
		app.Cache.clear('auth:me')
		return app.System.Request.post('/account/profile', { body })
	}

	/**
	 * Login via third-party vendor (OAuth)
	 */
	async vendorLogin(vendor: string, payload: Record<string, any>, remember = true) {
		const fp = await app.System.Fingerprint.get()
		const data = await app.System.Request.post<AuthPayload>(`/account/auth/vendor/${vendor}`, {
			body: { ...payload, fingerprint: fp.fingerprint, device_name: fp.deviceName },
			useAuth: false,
		})
		if (data) this.persistSession(data, remember)
		return data
	}

	/**
	 * Get vendor OAuth redirect URL
	 */
	async getVendorRedirectUrl(vendor: string, returnUrl?: string, mode?: string) {
		const base = `${app.Meta.app.apiBaseUrl}/account/auth/vendor/${vendor}/redirect`
		const params = new URLSearchParams()
		if (returnUrl) params.set('returnUrl', returnUrl)
		if (mode) params.set('mode', mode)
		const fp = await app.System.Fingerprint.get()
		if (fp.fingerprint) params.set('fingerprint', fp.fingerprint)
		if (fp.deviceName) params.set('device_name', fp.deviceName)
		const qs = params.toString()
		return qs ? `${base}?${qs}` : base
	}

	/**
	 * Get vendor info
	 */
	async vendorInfo(vendor: string) {
		return app.System.Request.post<{ vendor: Record<string, any> }>(`/account/auth/vendor/${vendor}`, {
			useAuth: false,
		})
	}

	/**
	 * Handle vendor OAuth callback - store tokens from URL params
	 * Note: OAuth logins default to "remember me" since user initiated redirect flow
	 */
	async handleVendorCallback(tokens: { access: string; refresh: string }, remember = true) {
		if (!tokens.access || !tokens.refresh) return false
		if (remember) {
			this.setCookie(this.keys.remember, '1', 30)
			this.setCookie(this.keys.access, tokens.access, 7)
			this.setCookie(this.keys.refresh, tokens.refresh, 30)
		} else {
			this.deleteCookie(this.keys.remember)
			this.setCookie(this.keys.access, tokens.access)
			this.setCookie(this.keys.refresh, tokens.refresh)
		}
		// Backfill fingerprint on the device created by the OAuth flow
		await this.updateCurrentDevice().catch(() => null)
		const user = await this.me(true)
		return !!user
	}

	/**
	 * List all connected vendor accounts for the current user
	 */
	async listVendors() {
		const data = await app.System.Request.post<{ vendors: UserVendorLink[] }>('/account/vendors')
		return data?.vendors ?? []
	}

	/**
	 * Connect a vendor account using a connect token from the OAuth callback
	 */
	async connectVendor(vendor: string, connectToken: string) {
		return app.System.Request.post<{ success: boolean; message: string }>(`/account/vendor/${vendor}/connect`, {
			body: { connect_token: connectToken },
		})
	}

	/**
	 * Disconnect a vendor account. Password required if it's the last linked vendor.
	 */
	async disconnectVendor(vendor: string, password?: string) {
		return app.System.Request.delete<{ success: boolean; message: string }>(`/account/vendor/${vendor}`, {
			body: password ? { password } : undefined,
		})
	}

	/**
	 * Request password reset - sends email with reset link
	 */
	async requestPasswordReset(email: string) {
		return app.System.Request.post<{ success: boolean; message: string }>('/auth/reset', {
			body: { email },
			useAuth: false,
		})
	}

	/**
	 * Confirm password reset with token
	 */
	async confirmPasswordReset(token: string, password: string) {
		return app.System.Request.post<{ success: boolean; message: string }>('/auth/reset/confirm', {
			body: { token, password },
			useAuth: false,
		})
	}

	/**
	 * Restore session from stored cookies on app init
	 */
	restore() {
		if (this.getAccessToken()) {
			this.ready = this.me().then(() => {}).catch(() => {})
		} else if (this.getRefreshToken()) {
			this.ready = this.refresh().then(() => {}).catch(() => {})
		}
	}

	/**
	 * Debug: dump all auth state to console
	 */
	debug() {
		const data = {
			accessToken: this.getAccessToken(),
			refreshToken: this.getRefreshToken(),
			remember: this.isRemembered(),
			stateUser: app.State.currentUser,
			isLoggedIn: this.isLoggedIn(),
		}
		console.table(data)
		return data
	}
}
