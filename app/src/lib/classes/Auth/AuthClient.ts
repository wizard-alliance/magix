import type { AuthPayload, UserDBRow, UserFull } from '../../types/types'

type LoginInput = { identifier: string; password: string; remember?: boolean }
type RegisterInput = { email: string; username: string; password: string; tos_accepted?: boolean }

const IS_SECURE = typeof location !== 'undefined' && location.protocol === 'https:'
const COOKIE_OPTS = `path=/; SameSite=Strict${IS_SECURE ? '; Secure' : ''}`
const isBrowser = typeof document !== 'undefined'

export class AuthClient {
	private keys = {
		access: 'auth_access_token',
		refresh: 'auth_refresh_token',
		remember: 'auth_remember',
	}

	private meCache: { data: UserFull | null; expires: number } | null = null
	private meCacheTTL = 10 * 60 * 1000 // 10 minutes

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
		this.meCache = null
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
		this.meCache = null
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
		const data = await app.System.Request.post<AuthPayload>('/account/auth/login', {
			body,
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

		if (!force && this.meCache && Date.now() < this.meCache.expires) {
			return this.meCache.data
		}

		try {
			const data = await app.System.Request.post<UserFull>('/account/me')
			if (data && !('error' in data)) {
				this.meCache = { data, expires: Date.now() + this.meCacheTTL }
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
		this.meCache = null
		return app.System.Request.post('/account/profile', { body })
	}

	/**
	 * Login via third-party vendor (OAuth)
	 */
	async vendorLogin(vendor: string, payload: Record<string, any>, remember = true) {
		const data = await app.System.Request.post<AuthPayload>(`/account/auth/vendor/${vendor}`, {
			body: payload,
			useAuth: false,
		})
		if (data) this.persistSession(data, remember)
		return data
	}

	/**
	 * Get vendor OAuth redirect URL
	 */
	getVendorRedirectUrl(vendor: string, returnUrl?: string) {
		const base = `${app.Config.apiBaseUrl}/account/auth/vendor/${vendor}/redirect`
		return returnUrl ? `${base}?returnUrl=${encodeURIComponent(returnUrl)}` : base
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
		const user = await this.me(true)
		return !!user
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
			this.me().catch(() => null)
		} else if (this.getRefreshToken()) {
			this.refresh().catch(() => null)
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
