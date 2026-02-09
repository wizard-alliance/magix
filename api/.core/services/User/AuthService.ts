import { randomUUID } from "crypto"

import { parseUtcDateTimeMs, futureUtcDateTime } from "./UserDbUtils.js"

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

	async register(input: RegisterInput, device?: UserDeviceContext): Promise<{ success: true; message: string } | { error: string; code?: number }> {
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

		// Send activation email
		const activationToken = (result as any).activationToken
		if (activationToken) {
			const baseUrl = api.Config("API_BASE_URL") || "http://localhost:1337"
			const confirmUrl = `${baseUrl}/api/v1/account/confirm?token=${activationToken}`

			await api.Mail.send({
				to: input.email,
				subject: "Verify your email",
				template: "verify-email",
				data: {
					user: { name: input.firstName || input.username },
					verify: { url: confirmUrl, expiresIn: "24 hours" },
				},
			})
		}

		return { success: true, message: "Account created. Please check your email to activate your account." }
	}

	async login(input: LoginInput): Promise<AuthPayload | { error: string; code?: number }> {
		const validation = await this.validateLogin(input)
		if (validation.error) {
			return { error: validation.message, code: validation.code }
		}

		return this.issueSession(validation.user!, input.device)
	}

	/** Validate login credentials and account state */
	async validateLogin(input: LoginInput): Promise<{ error: false; user: UserFull } | { error: true; message: string; code: number }> {
		const identifier = normalizeEmail(input.email) || normalizeUsername(input.username) || normalizeUsername(input.identifier)

		// Required fields
		if (!identifier) {
			return { error: true, message: "Email or username is required", code: 400 }
		}
		if (!input.password) {
			return { error: true, message: "Password is required", code: 400 }
		}

		// Get user and DB row
		const user = await api.User.Repo.get(identifier)
		const dbRow = await this.db.selectFrom("users").select(["password", "activated", "failed_login_attempts", "lockout_until"])
			.where((eb) => eb.or([ eb("email", "=", identifier), eb("username", "=", identifier) ]))
			.executeTakeFirst()

		// User not found (generic message to prevent enumeration)
		if (!dbRow?.password || !user) {
			return { error: true, message: "Invalid email/username or password", code: 401 }
		}

		// Account state checks
		if (user.info.deletedAt) {
			return { error: true, message: "This account has been deleted", code: 404 }
		}

		if (user.info.disabled) {
			return { error: true, message: "This account has been disabled. Please contact support.", code: 403 }
		}

		// Check lockout
		if (dbRow.lockout_until) {
			const lockoutUntil = parseUtcDateTimeMs(dbRow.lockout_until)
			if (Date.now() < lockoutUntil) {
				const minutes = Math.ceil((lockoutUntil - Date.now()) / 60000)
				return { error: true, message: `Account temporarily locked. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`, code: 429 }
			}
		}

		// Verify password
		const valid = await api.Utils.verifyPassword(input.password, dbRow.password)
		if (!valid) {
			// Track failed attempts
			await this.trackFailedLogin(user.id!)
			return { error: true, message: "Invalid email/username or password", code: 401 }
		}

		// Clear failed attempts on successful password
		if (dbRow.failed_login_attempts && dbRow.failed_login_attempts > 0) {
			await this.db.updateTable("users")
				.set({ failed_login_attempts: 0, lockout_until: null })
				.where("id", "=", user.id!)
				.execute()
		}

		// Check activation (after password verified)
		if (!dbRow.activated) {
			return { error: true, message: "Please verify your email before logging in. Check your inbox for the activation link.", code: 403 }
		}

		return { error: false, user }
	}

	/** Track failed login attempts and lock account if needed */
	private async trackFailedLogin(userId: number) {
		const MAX_ATTEMPTS = 5
		const LOCKOUT_MINUTES = 15

		const current = await this.db.selectFrom("users")
			.select("failed_login_attempts")
			.where("id", "=", userId)
			.executeTakeFirst()

		const attempts = (current?.failed_login_attempts ?? 0) + 1
		const lockout = attempts >= MAX_ATTEMPTS
			? futureUtcDateTime(LOCKOUT_MINUTES * 60 * 1000)
			: null

		await this.db.updateTable("users")
			.set({
				failed_login_attempts: attempts,
				lockout_until: lockout,
			})
			.where("id", "=", userId)
			.execute()
	}

	async vendorLogin(input: VendorLoginInput): Promise<AuthPayload | { error: string; code?: number }> {
		const vendor = api.User.Vendors.get(input.vendor)
		if (!vendor || !vendor.isEnabled()) {
			return { error: "Vendor not enabled", code: 400 }
		}

		const profile = vendor.parseProfile(input.payload ?? {})

		// 1. Check link table — stable identity across email changes
		const linked = await api.User.VendorLinks.findByVendor(input.vendor, profile.id)
		if (linked) {
			const user = await api.User.Repo.get(linked.user_id)
			if (user) {
				await api.User.VendorLinks.link(user.id!, input.vendor, profile) // refresh email/username
				return this.issueSession(user, { name: profile.displayName })
			}
		}

		// 2. Fall back to email match — auto-link existing account
		const existing = await api.User.Repo.exists(profile.email, profile.username)
		if (existing) {
			await api.User.VendorLinks.link(existing.id!, input.vendor, profile)
			return this.issueSession(existing, { name: profile.displayName })
		}

		// 3. Create new user + auto-activate + link
		const result = await api.User.Repo.create({
			email: profile.email,
			username: profile.username,
			password: randomUUID(),
			firstName: profile.displayName,
		})
		if ("error" in result) return result

		// Auto-activate vendor-created users so they can later use password-reset
		await this.db.updateTable("users")
			.set({ activated: 1, activation_token: null, activation_token_expiration: null })
			.where("id", "=", result.id)
			.execute()

		const user = await api.User.Repo.get(result.id)
		if (!user) return { error: "User not found after creation", code: 404 }

		await api.User.VendorLinks.link(user.id!, input.vendor, profile)
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

	/** Confirm account activation via token */
	async confirmActivation(token: string): Promise<{ success: true; message: string } | { error: string; code?: number }> {
		if (!token) {
			return { error: "Activation token required", code: 400 }
		}

		const user = await this.db.selectFrom("users")
			.select(["id", "activation_token_expiration", "activated"])
			.where("activation_token", "=", token)
			.executeTakeFirst()

		if (!user) {
			return { error: "Invalid or expired activation token", code: 400 }
		}

		if (user.activated) {
			return { success: true, message: "Account already activated" }
		}

		// Check expiration
		if (user.activation_token_expiration) {
			const expires = parseUtcDateTimeMs(user.activation_token_expiration)
			if (Date.now() > expires) {
				return { error: "Activation token has expired. Please register again.", code: 400 }
			}
		}

		// Activate the account and clear activation token
		await this.db.updateTable("users")
			.set({
				activated: 1,
				activation_token: null,
				activation_token_expiration: null,
			})
			.where("id", "=", user.id!)
			.execute()

		return { success: true, message: "Account activated successfully. You can now log in." }
	}

	/** Request password reset - sends email with reset link */
	async requestPasswordReset(email: string): Promise<{ success: true; message: string } | { error: string; code?: number }> {
		if (!email) {
			return { error: "Email required", code: 400 }
		}

		const normalizedEmail = normalizeEmail(email)
		const user = await this.db.selectFrom("users")
			.select(["id", "email", "username", "first_name", "deleted_at", "disabled"])
			.where("email", "=", normalizedEmail)
			.executeTakeFirst()

		// Always return success to prevent email enumeration
		const successMsg = { success: true as const, message: "If an account exists with this email, a reset link has been sent." }

		if (!user || user.deleted_at || user.disabled) {
			return successMsg
		}

		// Generate reset token (reusing activation_token field)
		const resetToken = randomUUID()
		const expires = futureUtcDateTime(60 * 60 * 1000) // 1 hour

		await this.db.updateTable("users")
			.set({
				activation_token: resetToken,
				activation_token_expiration: expires,
			})
			.where("id", "=", user.id!)
			.execute()

		// Send email
		const baseUrl = api.Config("WEB_URL") || "http://localhost:5173"
		const resetUrl = `${baseUrl}/account/reset?token=${resetToken}`

		await api.Mail.send({
			to: user.email,
			subject: "Reset your password",
			template: "password-reset",
			data: {
				user: { name: user.first_name || user.username },
				reset: { url: resetUrl, expiresIn: "1 hour" },
			},
		})

		return successMsg
	}

	/** Confirm password reset with token */
	async confirmPasswordReset(token: string, newPassword: string): Promise<{ success: true; message: string } | { error: string; code?: number }> {
		if (!token || !newPassword) {
			return { error: "Token and new password required", code: 400 }
		}

		const user = await this.db.selectFrom("users")
			.select(["id", "activation_token_expiration"])
			.where("activation_token", "=", token)
			.executeTakeFirst()

		if (!user) {
			return { error: "Invalid or expired reset token", code: 400 }
		}

		// Check expiration
		if (user.activation_token_expiration) {
			const expires = parseUtcDateTimeMs(user.activation_token_expiration)
			if (Date.now() > expires) {
				return { error: "Reset token has expired. Please request a new one.", code: 400 }
			}
		}

		const hashedPassword = await api.Utils.hashPassword(newPassword)

		// Update password and clear activation tokens
		await this.db.updateTable("users")
			.set({
				password: hashedPassword,
				activation_token: null,
				activation_token_expiration: null,
			})
			.where("id", "=", user.id!)
			.execute()

		// Logout all devices for security
		await api.User.Auth.logoutAllDevices(user.id!)

		return { success: true, message: "Password reset successfully. You can now log in with your new password." }
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

	/** Request email change - sends verification to new email */
	async requestEmailChange(userId: number, newEmail: string): Promise<{ success: true; message: string } | { error: string; code?: number }> {
		if (!newEmail) return { error: "New email required", code: 400 }

		const normalized = normalizeEmail(newEmail)
		const user = await api.User.Repo.get(userId)
		if (!user) return { error: "User not found", code: 404 }

		if (normalized === user.info.email) {
			return { error: "New email is the same as your current email", code: 400 }
		}

		// Check if email is already taken
		const existing = await this.db.selectFrom("users")
			.select("id")
			.where("email", "=", normalized)
			.where("deleted_at", "is", null)
			.executeTakeFirst()
		if (existing) return { error: "Email is already in use", code: 409 }

		const token = randomUUID()
		const expires = futureUtcDateTime(24 * 60 * 60 * 1000) // 24 hours

		await this.db.updateTable("users")
			.set({
				pending_email: normalized,
				email_change_token: token,
				email_change_token_expiration: expires,
			} as any)
			.where("id", "=", userId)
			.execute()

		const baseUrl = api.Config("API_BASE_URL") || "http://localhost:1337"
		const confirmUrl = `${baseUrl}/api/v1/account/confirm-email-change?token=${token}`

		await api.Mail.send({
			to: normalized,
			subject: "Confirm your new email address",
			template: "confirm-email-change",
			data: {
				user: { name: user.info.firstName || user.info.username },
				verify: { url: confirmUrl, expiresIn: "24 hours", newEmail: normalized },
			},
		})

		return { success: true, message: "A verification link has been sent to your new email address." }
	}

	/** Confirm email change with token */
	async confirmEmailChange(token: string): Promise<{ success: true; message: string } | { error: string; code?: number }> {
		if (!token) return { error: "Token required", code: 400 }

		const user = await this.db.selectFrom("users")
			.select(["id", "pending_email", "email_change_token_expiration"])
			.where("email_change_token" as any, "=", token)
			.executeTakeFirst()

		if (!user || !user.pending_email) {
			return { error: "Invalid or expired token", code: 400 }
		}

		if (user.email_change_token_expiration) {
			const expires = parseUtcDateTimeMs(user.email_change_token_expiration)
			if (Date.now() > expires) {
				return { error: "Token has expired. Please request a new email change.", code: 400 }
			}
		}

		// Check the new email isn't taken (race condition guard)
		const taken = await this.db.selectFrom("users")
			.select("id")
			.where("email", "=", user.pending_email)
			.where("deleted_at", "is", null)
			.executeTakeFirst()
		if (taken) return { error: "Email is already in use", code: 409 }

		// Apply the email change
		await this.db.updateTable("users")
			.set({
				email: user.pending_email,
				pending_email: null,
				email_change_token: null,
				email_change_token_expiration: null,
			} as any)
			.where("id", "=", user.id!)
			.execute()

		// Sync billing_customers email
		try {
			await api.Billing.Customers.update(
				{ billing_email: user.pending_email },
				{ user_id: user.id! as any }
			)
		} catch { /* no billing customer yet — fine */ }

		return { success: true, message: "Email address updated successfully." }
	}
}
