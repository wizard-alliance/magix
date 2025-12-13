import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js"

dayjs.extend(utc)

import { randomUUID } from "crypto"
import { AuthTokenManager } from "./AuthTokens.js"
import { AuthVendor } from "./AuthVendor.js"

import type {
	UserDBRow,
	UserDeviceDBRow,
	UserTokenRefreshDBRow,
} from "../../schema/Database.js"

import type {
	AuthPayload,
	LoginInput,
	RegisterInput,
	UserDeviceContext,
	VendorLoginInput,
	ChangePasswordInput,
} from "../../schema/AuthShapes.js"

import type { User } from "../../schema/DomainShapes.js"

const normalizeEmail = (value?: string | null) => (value ?? "").trim().toLowerCase()
const normalizeUsername = (value?: string | null) => (value ?? "").trim()

export class AuthService {
	private readonly prefix = "AuthService"
	private readonly db = api.DB.connection
	private readonly tokens = new AuthTokenManager()
	private readonly vendors: Record<string, AuthVendor>

	constructor() {
		this.vendors = {
			discord: new AuthVendor({
				name: "discord",
				enabled: api.Config("DISCORD_CLIENT_ENABLED") ? true : false,
				clientId: api.Config("DISCORD_CLIENT_ID") ?? "",
				clientSecret: api.Config("DISCORD_CLIENT_SECRET") ?? "",
				redirectUri: api.Config("DISCORD_REDIRECT_URI") ?? "",
				scope: ["identify", "email"],
			}),
			google: new AuthVendor({
				name: "google",
				enabled: api.Config("GOOGLE_CLIENT_ENABLED") ? true : false,
				clientId: api.Config("GOOGLE_CLIENT_ID") ?? "",
				clientSecret: api.Config("GOOGLE_CLIENT_SECRET") ?? "",
				redirectUri: api.Config("GOOGLE_REDIRECT_URI") ?? "",
				scope: ["profile", "email"],
			}),
		}
	}

	async hasPermissions(userId: number, perms: readonly string[]) {
		if (!perms.length) return true
		const rows = await this.db
			.selectFrom("user_permissions")
			.select(["name"])
			.where("user_id", "=", userId)
			.where("name", "in", perms as string[])
			.execute()
		const granted = new Set(rows.map((row) => row.name))
		return perms.every((perm) => granted.has(perm))
	}

	async register(input: RegisterInput, device?: UserDeviceContext): Promise<AuthPayload | { error: string; code?: number }> {
		const email = normalizeEmail(input.email)
		const username = normalizeUsername(input.username)
		if (!email || !username || !input.password) {
			return { error: "Email, username, and password are required", code: 400 }
		}

		const existing = await this.findUserByEmailOrUsername(email, username)
		if (existing) {
			return { error: "User already exists", code: 409 }
		}

		const password = await api.Utils.hashPassword(input.password)
		const now = dayjs().utc().format("YYYY-MM-DD HH:mm:ss")
		const insertResult = await this.db
			.insertInto("users")
			.values({
				email,
				username,
				password,
				first_name: input.firstName ?? null,
				last_name: input.lastName ?? null,
				tos_accepted: input.tosAccepted ? 1 : 0,
				activated: 1,
				disabled: 0,
				created: now,
				updated: now,
			} as any)
			.executeTakeFirst()

		const userId = this.extractInsertId(insertResult)
		if (!userId) {
			return { error: "Unable to create user", code: 500 }
		}

		const created = await this.getUserById(userId)
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

		const user = await this.findUserByIdentifier(identifier)
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
		const vendor = this.vendors[input.vendor]
		if (!vendor || !vendor.isEnabled()) {
			return { error: "Vendor not enabled", code: 400 }
		}

		const profile = vendor.parseProfile(input.payload ?? {})
		const existing = await this.findUserByEmailOrUsername(profile.email, profile.username)
		if (existing) {
			return this.issueSession(existing, { name: profile.displayName })
		}

		const randomPassword = randomUUID()
		const password = await api.Utils.hashPassword(randomPassword)
		const now = dayjs().utc().format("YYYY-MM-DD HH:mm:ss")
		const insertResult = await this.db
			.insertInto("users")
			.values({
				email: profile.email,
				username: profile.username,
				password,
				first_name: profile.displayName,
				activated: 1,
				tos_accepted: 1,
				disabled: 0,
				created: now,
				updated: now,
			} as any)
			.executeTakeFirst()

		const userId = this.extractInsertId(insertResult)
		if (!userId) {
			return { error: "Unable to create vendor user", code: 500 }
		}

		const created = await this.getUserById(userId)
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

		const stored = await this.db
			.selectFrom("user_tokens_refresh")
			.selectAll()
			.where("token", "=", refreshToken)
			.executeTakeFirst()
		if (!stored || stored.valid !== 1) {
			return { error: "Refresh token expired or revoked", code: 401 }
		}

		if (new Date(stored.expires).getTime() <= Date.now()) {
			return { error: "Refresh token expired", code: 401 }
		}

		if (await this.isBlacklisted(refreshToken)) {
			return { error: "Token revoked", code: 401 }
		}

		const user = await this.getUserById(stored.user_id)
		if (!user || !user.id || user.id === undefined || user.disabled || user.deleted_at) {
			return { error: "Account is disabled", code: 403 }
		}

		const access = this.tokens.signAccess({ sub: user.id, deviceId: stored.device_id })
		await this.storeAccessToken({
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
			const stored = await this.db
				.selectFrom("user_tokens_refresh")
				.selectAll()
				.where("token", "=", refreshToken)
				.executeTakeFirst()
			if (stored) {
				await this.invalidateRefreshToken(stored, "Logout")
			}
		} else if (accessToken) {
			const stored = await this.db
				.selectFrom("user_tokens_access")
				.selectAll()
				.where("token", "=", accessToken)
				.executeTakeFirst()
			if (stored) {
				const refresh = await this.db
					.selectFrom("user_tokens_refresh")
					.selectAll()
					.where("id", "=", stored.refresh_token_id)
					.executeTakeFirst()
				if (refresh) {
					await this.invalidateRefreshToken(refresh, "Logout")
				}
			}
		}
		return { success: true }
	}

	async logoutAllDevices(userId: number) {
		if (!userId) {
			return { error: "User identifier required", code: 400 }
		}
		await this.db
			.updateTable("user_tokens_refresh")
			.set({ valid: 0 })
			.where("user_id", "=", userId)
			.execute()
		await this.db.deleteFrom("user_tokens_access").where("user_id", "=", userId).execute()
		return { success: true }
	}

	async logoutAllUsers() {
		await this.db.updateTable("user_tokens_refresh").set({ valid: 0 }).execute()
		await this.db.deleteFrom("user_tokens_access").execute()
		return { success: true }
	}

	async changePassword(input: ChangePasswordInput) {
		if (!input.userId || !input.newPassword) {
			return { error: "User and new password required", code: 400 }
		}
		const user = await this.getUserById(input.userId)
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
		await this.db
			.updateTable("users")
			.set({ password: hashed, updated: dayjs().utc().format("YYYY-MM-DD HH:mm:ss") })
			.where("id", "=", input.userId)
			.execute()

		if (input.logoutAll !== false) {
			await this.logoutAllDevices(input.userId)
		}

		return { success: true }
	}

	async updateProfile(userId: number, payload: Partial<UserDBRow>) {
		if (!userId) {
			return { error: "User required", code: 400 }
		}
		const allowed: Partial<UserDBRow> = {
			first_name: payload.first_name ?? null,
			last_name: payload.last_name ?? null,
			phone: payload.phone ?? null,
			company: payload.company ?? null,
			address: payload.address ?? null,
		}
		await this.db
			.updateTable("users")
			.set({ ...allowed, updated: dayjs().utc().format("YYYY-MM-DD HH:mm:ss") })
			.where("id", "=", userId)
			.execute()

		const updated = await this.getUserById(userId)
		return updated ? this.toAccount(updated) : { error: "User not found", code: 404 }
	}

	getVendorInfo(vendor: string) {
		const resolved = this.vendors[vendor]
		if (!resolved) {
			return { error: "Unknown vendor", code: 404 }
		}
		return { vendor: resolved.info() }
	}

	private async issueSession(user: UserDBRow, device?: UserDeviceContext): Promise<AuthPayload> {
		const deviceId = await this.upsertDevice(user.id!, device)
		const refresh = this.tokens.signRefresh({ sub: user.id!, deviceId })

		const refreshId = await this.storeRefreshToken({
			userId: user.id!,
			deviceId,
			token: refresh.token,
			expires: refresh.expiresAt,
		})

		const access = this.tokens.signAccess({ sub: user.id!, deviceId })
		await this.storeAccessToken({
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

	private async findUserByIdentifier(identifier: string): Promise<UserDBRow | null> {
		const normalized = normalizeEmail(identifier) || normalizeUsername(identifier)
		return this.db
			.selectFrom("users")
			.selectAll()
			.where((eb) =>
				eb.or([
					eb("email", "=", normalized),
					eb("username", "=", normalized),
				])
			)
			.executeTakeFirst() as any
	}

	private async findUserByEmailOrUsername(email?: string, username?: string): Promise<UserDBRow | null> {
		const normalizedEmail = normalizeEmail(email)
		const normalizedUsername = normalizeUsername(username)
		if (!normalizedEmail && !normalizedUsername) {
			return null
		}
		let query = this.db.selectFrom("users").selectAll()
		if (normalizedEmail && normalizedUsername) {
			query = query.where((eb) =>
				eb.or([
					eb("email", "=", normalizedEmail),
					eb("username", "=", normalizedUsername),
				])
			)
		} else if (normalizedEmail) {
			query = query.where("email", "=", normalizedEmail)
		} else if (normalizedUsername) {
			query = query.where("username", "=", normalizedUsername)
		}
		return query.executeTakeFirst() as any
	}

	private async getUserById(id: number): Promise<UserDBRow | null> {
		return this.db.selectFrom("users").selectAll().where("id", "=", id).executeTakeFirst() as any
	}

	private extractInsertId(result: any): number | null {
		const raw = result?.insertId ?? result?.insertedId
		if (typeof raw === "bigint") return Number(raw)
		if (typeof raw === "number") return raw
		return null
	}

	private async upsertDevice(userId: number, device?: UserDeviceContext): Promise<number | null> {
		if (!device) {
			return null
		}

		const fingerprint = device.fingerprint ?? null
		const existing = fingerprint
			? await this.db
				.selectFrom("user_devices")
				.selectAll()
				.where("user_id", "=", userId)
				.where("fingerprint", "=", fingerprint)
				.executeTakeFirst()
			: null

		const payload: Partial<UserDeviceDBRow> = {
			user_id: userId,
			name: device.name ?? null,
			custom_name: device.customName ?? null,
			fingerprint,
			user_agent: device.userAgent ?? null,
			ip: device.ip ?? null,
			last_login: dayjs().utc().format("YYYY-MM-DD HH:mm:ss"),
			updated: dayjs().utc().format("YYYY-MM-DD HH:mm:ss"),
		}

		if (existing?.id) {
			await this.db
				.updateTable("user_devices")
				.set(payload)
				.where("id", "=", existing.id)
				.execute()
			return existing.id
		}

		const result = await this.db.insertInto("user_devices").values(payload as any).executeTakeFirst()
		return this.extractInsertId(result)
	}

	private async storeRefreshToken(options: {
		userId: number
		deviceId: number | null
		token: string
		expires: Date
	}): Promise<number> {
		const result = await this.db
			.insertInto("user_tokens_refresh")
			.values({
				user_id: options.userId,
				device_id: options.deviceId,
				token: options.token,
				valid: 1,
				expires: dayjs(options.expires).utc().format("YYYY-MM-DD HH:mm:ss")
			})
			.executeTakeFirst()
		return this.extractInsertId(result) ?? 0
	}

	private async storeAccessToken(options: {
		userId: number
		refreshId: number
		token: string
		expires: Date
	}) {
		await this.db
			.insertInto("user_tokens_access")
			.values({
				user_id: options.userId,
				refresh_token_id: options.refreshId,
				token: options.token,
				expires: dayjs(options.expires).utc().format("YYYY-MM-DD HH:mm:ss"),
			})
			.executeTakeFirst()
	}

	private async isBlacklisted(token: string) {
		const entry = await this.db
			.selectFrom("user_tokens_blacklist")
			.selectAll()
			.where("token", "=", token)
			.executeTakeFirst()
		if (!entry) {
			return false
		}
		if (!entry.expires) {
			return true
		}
		return new Date(entry.expires).getTime() > Date.now()
	}

	private async blacklistToken(options: {
		userId: number
		token: string
		tokenType: string
		expires: string
		reason?: string
	}) {
		await this.db
			.insertInto("user_tokens_blacklist")
			.values({
				user_id: options.userId,
				token: options.token,
				token_type: options.tokenType,
				expires: options.expires,
				reason: options.reason ?? null,
			})
			.execute()
	}

	private async invalidateRefreshToken(row: UserTokenRefreshDBRow, reason: string) {
		await this.db.updateTable("user_tokens_refresh").set({ valid: 0 }).where("id", "=", row.id!).execute()
		await this.db.deleteFrom("user_tokens_access").where("refresh_token_id", "=", row.id!).execute()
		await this.blacklistToken({
			userId: row.user_id,
			token: row.token,
			tokenType: "refresh",
			expires: row.expires,
			reason,
		})
	}

	private async validateAccessFromSignature(token: string) {
		const verification = this.tokens.verify(token, "access")
		if (!verification.valid || !verification.payload) {
			return { valid: false, reason: verification.reason ?? "Invalid token", code: 401, user: null }
		}
		const user = await this.getUserById(verification.payload.sub)
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

		if (await this.isBlacklisted(token)) {
			return { valid: false, reason: "Token revoked", code: 401 }
		}

		const stored = await this.db
			.selectFrom("user_tokens_access")
			.selectAll()
			.where("token", "=", token)
			.executeTakeFirst()

		if (stored) {
			if (new Date(stored.expires).getTime() <= Date.now()) {
				return { valid: false, reason: "Token expired", code: 401 }
			}

			const refresh = await this.db
				.selectFrom("user_tokens_refresh")
				.selectAll()
				.where("id", "=", stored.refresh_token_id)
				.executeTakeFirst()
			if (!refresh || refresh.valid !== 1) {
				return { valid: false, reason: "Session revoked", code: 401 }
			}
		}

		return { valid: true, user: fromSig.user ?? undefined }
	}
}
