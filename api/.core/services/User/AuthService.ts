import { randomUUID } from "crypto"

import { parseUtcDateTimeMs } from "./UserDbUtils.js"

// Types
import type { UserDBRow } from "../../schema/Database.js"
import { normalizeUsername, normalizeEmail } from "./UserRepo.js"

import type { 
	AuthPayload, 
	LoginInput, RegisterInput, 
	UserDeviceContext, VendorLoginInput 
} from "../../schema/AuthShapes.js"
import { UserFull } from "@api/core/schema/DomainShapes.js"


export class AuthService {
	private readonly db = api.DB.connection
	private readonly prefix = "AuthService"

	async register(input: RegisterInput, device?: UserDeviceContext): Promise<AuthPayload | { error: string; code?: number }> {
		if (!input.email || !input.username || !input.password) {
			return { error: "Email, username, and password are required", code: 400 }
		}
		const result = await api.User.Repo.create({
			email: input.email,
			username: input.username,
			password: input.password,
			firstName: input.firstName,
			lastName: input.lastName,
			tosAccepted: input.tosAccepted,
		})
		if ("error" in result) return result

		const user = await api.User.Repo.get(result.id)
		if (!user) return { error: "User not found after creation", code: 404 }
		return this.issueSession(user, device)
	}

	async login(input: LoginInput): Promise<AuthPayload | { error: string; code?: number }> {
		const identifier = normalizeEmail(input.email) || normalizeUsername(input.username) || normalizeUsername(input.identifier)
		if (!identifier || !input.password) {
			return { error: "Identifier and password are required", code: 400 }
		}

		const user = await api.User.Repo.get(identifier)
		// Query DB for pw
		const dbPassword = await this.db.selectFrom("users").select("password")
			.where((eb) => eb.or([ eb("email", "=", identifier), eb("username", "=", identifier) ]))
			.executeTakeFirst()
			.then((r) => r?.password ?? null)
				
		console.log(dbPassword);

		if( !dbPassword ) {
			return { error: "Invalid credentials", code: 401 }
		}

		if (!user) {
			return { error: "Invalid credentials", code: 401 }
		}

		if (user.info.deletedAt) {
			return { error: "Account not found or deleted", code: 404 }
		}

		if (user.info.disabled) {
			return { error: "Account is disabled", code: 403 }
		}

		const valid = await api.Utils.verifyPassword(input.password, dbPassword)
		if (!valid) {
			return { error: "Invalid credentials", code: 401 }
		}

		return this.issueSession(user, input.device)
	}

	async vendorLogin(input: VendorLoginInput): Promise<AuthPayload | { error: string; code?: number }> {
		const vendor = api.User.Vendors.get(input.vendor)
		if (!vendor || !vendor.isEnabled()) {
			return { error: "Vendor not enabled", code: 400 }
		}

		const profile = vendor.parseProfile(input.payload ?? {})
		const existing = await api.User.Repo.exists(profile.email, profile.username)
		if (existing) {
			return this.issueSession(existing, { name: profile.displayName })
		}

		const result = await api.User.Repo.create({
			email: profile.email,
			username: profile.username,
			password: randomUUID(),
			firstName: profile.displayName,
		})
		if ("error" in result) return result

		const user = await api.User.Repo.get(result.id)
		if (!user) return { error: "User not found after creation", code: 404 }
		return this.issueSession(user, { name: profile.displayName })
	}

	async refresh(refreshToken: string): Promise<AuthPayload | { error: string; code?: number }> {
		if (!refreshToken) {
			return { error: "Refresh token required", code: 400 }
		}
		const verification = api.User.Tokens.verify(refreshToken, "refresh")
		if (!verification.valid || !verification.payload) {
			return { error: verification.reason ?? "Invalid refresh token", code: 401 }
		}

		const stored = await api.User.TokenStore.getRefreshToken(refreshToken)
		if (!stored || stored.valid !== 1) {
			return { error: "Refresh token expired or revoked", code: 401 }
		}

		if (parseUtcDateTimeMs(stored.expires) <= Date.now()) {
			return { error: "Refresh token expired", code: 401 }
		}

		if (await api.User.TokenStore.isBlacklisted(refreshToken)) {
			return { error: "Token revoked", code: 401 }
		}

		const user = await api.User.Repo.get(stored.user_id)
		
		if (!user || !user.id || user.info.deletedAt) {
			return { error: "Account not found or deleted", code: 404 }
		}

		if (user.info.disabled) {
			return { error: "Account is disabled", code: 403 }
		}

		const access = api.User.Tokens.signAccess({ sub: user.id, deviceId: stored.device_id })
		await api.User.TokenStore.storeAccessToken({
			userId: user.id,
			refreshId: stored.id!,
			token: access.token,
			expires: access.expiresAt,
		})

		return {
			user: (await api.User.Repo.get(user.id!))!,
			tokens: {
				access,
				refresh: { token: refreshToken, expiresAt: new Date(parseUtcDateTimeMs(stored.expires)) },
			},
		}
	}

	async logout(refreshToken?: string, accessToken?: string) {
		if (refreshToken) {
			await api.User.TokenStore.revokeByRefreshToken(refreshToken, "Logout")
		} else if (accessToken) {
			await api.User.TokenStore.revokeByAccessToken(accessToken, "Logout")
		}
		return { success: true }
	}

	async logoutAllDevices(userId: number) {
		if (!userId) {
			return { error: "User identifier required", code: 400 }
		}
		await api.User.TokenStore.revokeAllDevices(userId)
		return { success: true }
	}

	async logoutAllUsers() {
		await api.User.TokenStore.revokeAllUsers()
		return { success: true }
	}

	private async issueSession(user: UserFull, device?: UserDeviceContext): Promise<AuthPayload> {
		const deviceId = await api.User.Devices.upsertDevice(user.id!, device)
		const refresh = api.User.Tokens.signRefresh({ sub: user.id!, deviceId })

		const refreshId = await api.User.TokenStore.storeRefreshToken({
			userId: user.id!,
			deviceId,
			token: refresh.token,
			expires: refresh.expiresAt,
		})

		const access = api.User.Tokens.signAccess({ sub: user.id!, deviceId })
		await api.User.TokenStore.storeAccessToken({
			userId: user.id!,
			refreshId,
			token: access.token,
			expires: access.expiresAt,
		})

		return {
			user: (await api.User.Repo.get(user.id!))!,
			tokens: { access, refresh },
		}
	}

	private async validateAccessFromSignature(token: string) {
		const verification = api.User.Tokens.verify(token, "access")
		if (!verification.valid || !verification.payload) {
			return { valid: false, reason: verification.reason ?? "Invalid token", code: 401, user: null }
		}

		const user = await api.User.Repo.get(verification.payload.sub)
		console.log(user)

		if (!user || user.info.deletedAt) {
			return { valid: false, reason: "Account not found or deleted", code: 404, user: null }
		}
		if (user.info.disabled) {
			return { valid: false, reason: "Account disabled", code: 403, user: null }
		}
		return { valid: true, user, payload: verification.payload }
	}

	public async validateAccessToken(token: string): Promise<
	{ valid: boolean, user?: UserFull, reason?: string, code?: number }> {
		const fromSig = await this.validateAccessFromSignature(token)

		// Fallback: if signature check fails but token exists 
		// in store and is not expired/revoked, trust DB record
		if (!fromSig.valid) {
			const stored = await api.User.TokenStore.getAccessToken(token)
			if (stored) {
				const refresh = await api.User.TokenStore.getRefreshById(stored.refresh_token_id)
				const dbExpiry = parseUtcDateTimeMs(stored.expires)
				const nowMs = Date.now()
				const expired = dbExpiry <= nowMs
				const revoked = !refresh || refresh.valid !== 1
				if (!expired && !revoked) {
					return { valid: true, user: refresh ? await api.User.Repo.get(refresh.user_id) ?? undefined : undefined }
				}
			}
			return { valid: false, reason: fromSig.reason, code: fromSig.code }
		}

		if (await api.User.TokenStore.isBlacklisted(token)) {
			return { valid: false, reason: "Token revoked", code: 401 }
		}

		const stored = await api.User.TokenStore.getAccessToken(token)
		if (stored) {
			const dbExpiry = parseUtcDateTimeMs(stored.expires)
			const nowMs = Date.now()
			if (dbExpiry <= nowMs) {
				return { valid: false, reason: "Token expired", code: 401 }
			}

			const refresh = await api.User.TokenStore.getRefreshById(stored.refresh_token_id)
			if (!refresh || refresh.valid !== 1) {
				return { valid: false, reason: "Session revoked", code: 401 }
			}
		}

		return { valid: true, user: fromSig.user ?? undefined }
	}
}
