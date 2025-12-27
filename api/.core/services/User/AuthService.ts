import { randomUUID } from "crypto"
import { AuthTokenManager } from "./AuthTokens.js"
import { DeviceService } from "./DeviceService.js"
import { PermissionService } from "./PermissionService.js"
import { TokenStore } from "./TokenStore.js"
import { UserRepo, normalizeEmail, normalizeUsername } from "./UserRepo.js"
import { VendorRegistry } from "./VendorRegistry.js"

import type { UserDBRow } from "../../schema/Database.js"

import type { AuthPayload, ChangePasswordInput, LoginInput, RegisterInput, UserDeviceContext, VendorLoginInput } from "../../schema/AuthShapes.js"

import type { User } from "../../schema/DomainShapes.js"

export class AuthService {
	private readonly prefix = "AuthService"
	private readonly tokens = new AuthTokenManager()
	private readonly users = new UserRepo()
	private readonly devices = new DeviceService()
	private readonly tokenStore = new TokenStore()
	private readonly vendors = new VendorRegistry()
	private readonly permissions = new PermissionService()

	async hasPermissions(userId: number, perms: readonly string[]) {
		return this.permissions.hasPermissions(userId, perms)
	}

	async register(input: RegisterInput, device?: UserDeviceContext): Promise<AuthPayload | { error: string; code?: number }> {
		const email = normalizeEmail(input.email)
		const username = normalizeUsername(input.username)
		if (!email || !username || !input.password) {
			return { error: "Email, username, and password are required", code: 400 }
		}

		const existing = await this.users.findByEmailOrUsername(email, username)
		if (existing) {
			return { error: "User already exists", code: 409 }
		}

		const password = await api.Utils.hashPassword(input.password)
		const userId = await this.users.createLocalUser({ email, username, password, register: input })
		if (!userId) {
			return { error: "Unable to create user", code: 500 }
		}

		const created = await this.users.findById(userId)
		if (!created) {
			return { error: "User not found after creation", code: 404 }
		}

		return this.issueSession(created, device)
	}

	async login(input: LoginInput): Promise<AuthPayload | { error: string; code?: number }> {
		const identifier = normalizeEmail(input.email) || normalizeUsername(input.username) || normalizeUsername(input.identifier)
		if (!identifier || !input.password) {
			return { error: "Identifier and password are required", code: 400 }
		}

		const user = await this.users.findByIdentifier(identifier)
		if (!user) {
			return { error: "Invalid credentials", code: 401 }
		}
		if (user.disabled || user.deleted_at) {
			return { error: "Account is disabled", code: 403 }
		}

		const valid = await api.Utils.verifyPassword(input.password, user.password)
		if (!valid) {
			return { error: "Invalid credentials", code: 401 }
		}

		return this.issueSession(user, input.device)
	}

	async vendorLogin(input: VendorLoginInput): Promise<AuthPayload | { error: string; code?: number }> {
		const vendor = this.vendors.get(input.vendor)
		if (!vendor || !vendor.isEnabled()) {
			return { error: "Vendor not enabled", code: 400 }
		}

		const profile = vendor.parseProfile(input.payload ?? {})
		const existing = await this.users.findByEmailOrUsername(profile.email, profile.username)
		if (existing) {
			return this.issueSession(existing, { name: profile.displayName })
		}

		const randomPassword = randomUUID()
		const password = await api.Utils.hashPassword(randomPassword)
		const userId = await this.users.createVendorUser({
			email: profile.email,
			username: profile.username,
			password,
			displayName: profile.displayName,
		})
		if (!userId) {
			return { error: "Unable to create vendor user", code: 500 }
		}

		const created = await this.users.findById(userId)
		if (!created) {
			return { error: "User not found after creation", code: 404 }
		}

		return this.issueSession(created, { name: profile.displayName })
	}

	async refresh(refreshToken: string): Promise<AuthPayload | { error: string; code?: number }> {
		if (!refreshToken) {
			return { error: "Refresh token required", code: 400 }
		}
		const verification = this.tokens.verify(refreshToken, "refresh")
		if (!verification.valid || !verification.payload) {
			return { error: verification.reason ?? "Invalid refresh token", code: 401 }
		}

		const stored = await this.tokenStore.getRefreshToken(refreshToken)
		if (!stored || stored.valid !== 1) {
			return { error: "Refresh token expired or revoked", code: 401 }
		}

		if (new Date(stored.expires).getTime() <= Date.now()) {
			return { error: "Refresh token expired", code: 401 }
		}

		if (await this.tokenStore.isBlacklisted(refreshToken)) {
			return { error: "Token revoked", code: 401 }
		}

		const user = await this.users.findById(stored.user_id)
		if (!user || !user.id || user.id === undefined || user.disabled || user.deleted_at) {
			return { error: "Account is disabled", code: 403 }
		}

		const access = this.tokens.signAccess({ sub: user.id, deviceId: stored.device_id })
		await this.tokenStore.storeAccessToken({
			userId: user.id,
			refreshId: stored.id!,
			token: access.token,
			expires: access.expiresAt,
		})

		return {
			user: this.toAccount(user),
			tokens: {
				access,
				refresh: { token: refreshToken, expiresAt: new Date(stored.expires) },
			},
		}
	}

	async me(accessToken: string): Promise<{ user: User } | { error: string; code?: number }> {
		if (!accessToken) {
			return { error: "Access token required", code: 401 }
		}
		const validation = await this.validateAccessToken(accessToken)
		if (!validation.valid || !validation.user) {
			return { error: validation.reason ?? "Invalid token", code: validation.code ?? 401 }
		}
		return { user: this.toAccount(validation.user) }
	}

	async logout(refreshToken?: string, accessToken?: string) {
		if (refreshToken) {
			await this.tokenStore.revokeByRefreshToken(refreshToken, "Logout")
		} else if (accessToken) {
			await this.tokenStore.revokeByAccessToken(accessToken, "Logout")
		}
		return { success: true }
	}

	async logoutAllDevices(userId: number) {
		if (!userId) {
			return { error: "User identifier required", code: 400 }
		}
		await this.tokenStore.revokeAllDevices(userId)
		return { success: true }
	}

	async logoutAllUsers() {
		await this.tokenStore.revokeAllUsers()
		return { success: true }
	}

	async changePassword(input: ChangePasswordInput) {
		if (!input.userId || !input.newPassword) {
			return { error: "User and new password required", code: 400 }
		}
		const user = await this.users.findById(input.userId)
		if (!user) {
			return { error: "User not found", code: 404 }
		}

		if (user.password) {
			const matches = await api.Utils.verifyPassword(input.currentPassword ?? "", user.password)
			if (!matches) {
				return { error: "Current password incorrect", code: 401 }
			}
		}

		const hashed = await api.Utils.hashPassword(input.newPassword)
		await this.users.updatePassword(input.userId, hashed)

		if (input.logoutAll !== false) {
			await this.logoutAllDevices(input.userId)
		}

		return { success: true }
	}

	async updateProfile(userId: number, payload: Partial<UserDBRow>) {
		if (!userId) {
			return { error: "User required", code: 400 }
		}
		const updated = await this.users.updateProfile(userId, payload)
		return updated ? this.toAccount(updated) : { error: "User not found", code: 404 }
	}

	getVendorInfo(vendor: string) {
		return this.vendors.getInfo(vendor)
	}

	private async issueSession(user: UserDBRow, device?: UserDeviceContext): Promise<AuthPayload> {
		const deviceId = await this.devices.upsertDevice(user.id!, device)
		const refresh = this.tokens.signRefresh({ sub: user.id!, deviceId })

		const refreshId = await this.tokenStore.storeRefreshToken({
			userId: user.id!,
			deviceId,
			token: refresh.token,
			expires: refresh.expiresAt,
		})

		const access = this.tokens.signAccess({ sub: user.id!, deviceId })
		await this.tokenStore.storeAccessToken({
			userId: user.id!,
			refreshId,
			token: access.token,
			expires: access.expiresAt,
		})

		return {
			user: this.toAccount(user),
			tokens: {
				access,
				refresh,
			},
		}
	}

	private toAccount(row: UserDBRow): User {
		return {
			id: row.id ?? 0,
			email: row.email,
			username: row.username,
			firstName: row.first_name ?? null,
			lastName: row.last_name ?? null,
			phone: row.phone ?? null,
			company: row.company ?? null,
			address: row.address ?? null,
			activated: Boolean(row.activated),
			disabled: Boolean(row.disabled),
			created: row.created,
			updated: row.updated,
		}
	}

	private async validateAccessFromSignature(token: string) {
		const verification = this.tokens.verify(token, "access")
		if (!verification.valid || !verification.payload) {
			return { valid: false, reason: verification.reason ?? "Invalid token", code: 401, user: null }
		}
		const user = await this.users.findById(verification.payload.sub)
		if (!user) {
			return { valid: false, reason: "User not found", code: 404, user: null }
		}
		if (user.disabled || user.deleted_at) {
			return { valid: false, reason: "Account disabled", code: 403, user: null }
		}
		return { valid: true, user, payload: verification.payload }
	}

	public async validateAccessToken(token: string): Promise<{
		valid: boolean
		user?: UserDBRow
		reason?: string
		code?: number
	}> {
		const fromSig = await this.validateAccessFromSignature(token)
		if (!fromSig.valid) {
			return { valid: false, reason: fromSig.reason, code: fromSig.code }
		}

		if (await this.tokenStore.isBlacklisted(token)) {
			return { valid: false, reason: "Token revoked", code: 401 }
		}

		const stored = await this.tokenStore.getAccessToken(token)

		if (stored) {
			if (new Date(stored.expires).getTime() <= Date.now()) {
				return { valid: false, reason: "Token expired", code: 401 }
			}

			const refresh = await this.tokenStore.getRefreshById(stored.refresh_token_id)
			if (!refresh || refresh.valid !== 1) {
				return { valid: false, reason: "Session revoked", code: 401 }
			}
		}

		return { valid: true, user: fromSig.user ?? undefined }
	}
}
