import { randomUUID } from "crypto"
import type { UserDBRow } from "../../schema/Database.js"
import { nowUtcDateTime, futureUtcDateTime, parseUtcDateTimeMs } from "./UserDbUtils.js"
import type { UserFull } from "../../schema/DomainShapes.js"

export const normalizeEmail = (value?: string | number | null) => `${value ?? ""}`.trim().toLowerCase()
export const normalizeUsername = (value?: string | number | null) => `${value ?? ""}`.trim()

export type UserCreateInput = {
	email: string
	username: string
	password: string
	firstName?: string
	lastName?: string
	tosAccepted?: boolean
}

export class UserRepo {
	private readonly db = api.DB.connection

	async me(accessToken: string): Promise<UserFull | { error: string; code?: number }> {
		if (!accessToken) return { error: "Access token required", code: 401 }
		const validation = await api.User.Auth.validateAccessToken(accessToken)
		if (!validation.valid || !validation.user) {
			return { error: validation.reason ?? "Invalid token", code: validation.code ?? 401 }
		}
		return await this.get(validation.user.id!, validation.deviceId ?? undefined) ?? { error: "User not found", code: 404 }
	}

	/** 
	 * Get user by ID or identifier (email/username)
	 */
	async get(idOrIdentifier: number | string, currentDeviceId?: number): Promise<UserFull | null> {
		const normalized = normalizeEmail(idOrIdentifier) || normalizeUsername(idOrIdentifier)
		const user = await this.db.selectFrom("users")
			.selectAll()
			.where((eb) => eb.or([
				eb("id", "=", api.Utils.toNumber(idOrIdentifier)), 
				eb("email", "=", normalized), 
				eb("username", "=", normalized)
			]))
			.executeTakeFirst() as any

		if (!user || !user.id) return null

		const [perms, deviceRows, settingRows, refreshRows] = await Promise.all([
			api.User.Permissions.list(user.id),
			this.db.selectFrom("user_devices").selectAll().where("user_id", "=", user.id).execute(),
			this.db.selectFrom("user_settings").selectAll().where("user_id", "=", user.id).execute(),
			this.db.selectFrom("user_tokens_refresh").selectAll().where("user_id", "=", user.id).execute(),
		])

		const sessionsByDevice = new Map<number, typeof refreshRows>()
		for (const r of refreshRows) {
			if (!r.device_id) continue
			const list = sessionsByDevice.get(r.device_id) ?? []
			list.push(r)
			sessionsByDevice.set(r.device_id, list)
		}

		const devices = deviceRows.map((d) => ({
			id: d.id!,
			name: d.name ?? null,
			customName: d.custom_name ?? null,
			fingerprint: d.fingerprint ?? null,
			userAgent: d.user_agent ?? null,
			ip: d.ip ?? null,
			lastLogin: d.last_login ?? null,
			created: d.created ?? null,
			current: currentDeviceId ? d.id === currentDeviceId : false,
			sessions: (sessionsByDevice.get(d.id!) ?? []).map((s) => ({
				id: s.id!,
				valid: s.valid === 1,
				expires: s.expires ?? null,
				created: s.created ?? null,
			})),
		}))

		// Compute lastLogin from the most recent device activity
		let lastLogin: string | null = null
		let latestMs = 0
		for (const d of devices) {
			if (d.lastLogin) {
				const ms = parseUtcDateTimeMs(d.lastLogin)
				if (ms > latestMs) { latestMs = ms; lastLogin = d.lastLogin }
			}
		}

		// Resolve avatar file record if avatar exists
		let avatar = null
		if (user.avatar_url) {
			try {
				const filename = user.avatar_url.split(`/`).pop()!
				const category = user.avatar_url.startsWith(`avatar/`) ? `avatar` : null
				if (category) {
					avatar = await api.FileManager.getFile(category, filename)
				}
			} catch { /* file missing on disk — leave null */ }
		}

		return {
			id: user.id,
			info: {
				id: user.id,
				email: user.email,
				username: user.username,
				firstName: user.first_name ?? null,
				lastName: user.last_name ?? null,
				phone: user.phone ?? null,
				company: user.company ?? null,
				address: user.address ?? null,
				avatarUrl: user.avatar_url ?? null,
				avatar,
				activated: Boolean(user.activated),
				disabled: Boolean(user.disabled),
				deletedAt: user.deleted_at ?? null,
				tosAccepted: Boolean(user.tos_accepted),
				deletedAt: user.deleted_at ?? null,
				pendingEmail: user.pending_email ?? null,
				created: user.created,
				updated: user.updated,
			},
			permissions: perms,
			settings: settingRows.map((s) => ({ key: s.key, value: s.value ?? null })),
			devices,
			lastLogin,
		}
	}
	

	/**
	 * List all non-deleted users with optional search and filters
	 */
	list = async (options?: { limit?: number; offset?: number; search?: string; disabled?: number; activated?: number }): Promise<UserFull[]> => {
		let query = this.db.selectFrom("users").select("id").where("deleted_at", "is", null)

		if (options?.disabled !== undefined) query = query.where("disabled", "=", options.disabled)
		if (options?.activated !== undefined) query = query.where("activated", "=", options.activated)

		if (options?.search) {
			const term = `%${options.search}%`
			const numericId = Number(options.search)
			query = query.where((eb) =>
				eb.or([
					eb("first_name", "like", term),
					eb("last_name", "like", term),
					eb("email", "like", term),
					eb("username", "like", term),
					eb("company", "like", term),
					...(Number.isFinite(numericId) && numericId > 0 ? [eb("id", "=", numericId)] : []),
				])
			)
		}

		if (options?.limit) query = query.limit(options.limit)
		if (options?.offset) query = query.offset(options.offset)
		const results = await query.execute()

		const users: UserFull[] = []
		for (const row of results) {
			const user = await this.get(row.id)
			if (user) users.push(user)
		}

		return users
	}

	/** Check if user exists by email or username */
	exists = async (email?: string, username?: string): Promise<UserFull | null> => {
		const user = await this.get(normalizeEmail(email) || normalizeUsername(username) || "")
		return user || null
	}

	/** Validate user creation input */
	validateCreate = async (input: UserCreateInput): Promise<{ error: false } | { error: true; message: string; code: number }> => {
		const email = normalizeEmail(input.email)
		const username = normalizeUsername(input.username)

		// Required fields
		if (!email) {
			return { error: true, message: "Email is required", code: 400 }
		}
		if (!username) {
			return { error: true, message: "Username is required", code: 400 }
		}
		if (!input.password) {
			return { error: true, message: "Password is required", code: 400 }
		}

		// Email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email)) {
			return { error: true, message: "Invalid email format", code: 400 }
		}

		// Username rules
		if (username.length < 3) {
			return { error: true, message: "Username must be at least 3 characters", code: 400 }
		}
		if (username.length > 32) {
			return { error: true, message: "Username must be 32 characters or less", code: 400 }
		}
		if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
			return { error: true, message: "Username can only contain letters, numbers, underscores, and hyphens", code: 400 }
		}

		// Password strength
		if (input.password.length < 8) {
			return { error: true, message: "Password must be at least 8 characters", code: 400 }
		}

		// Check for existing email
		const existingEmail = await this.db.selectFrom("users")
			.select("id")
			.where("email", "=", email)
			.executeTakeFirst()
		if (existingEmail) {
			return { error: true, message: "An account with this email already exists", code: 409 }
		}

		// Check for existing username
		const existingUsername = await this.db.selectFrom("users")
			.select("id")
			.where("username", "=", username)
			.executeTakeFirst()
		if (existingUsername) {
			return { error: true, message: "This username is already taken", code: 409 }
		}

		return { error: false }
	}

	/** Create a new user */
	create = async (input: UserCreateInput): Promise<{ id: number; activationToken: string } | { error: string; code: number }> => {
		const validation = await this.validateCreate(input)
		if (validation.error) {
			return { error: validation.message, code: validation.code }
		}

		const email = normalizeEmail(input.email)
		const username = normalizeUsername(input.username)
		const password = await api.Utils.hashPassword(input.password)
		const now = nowUtcDateTime()
		const activationToken = randomUUID()
		const activationExpires = futureUtcDateTime(24 * 60 * 60 * 1000) // 24 hours

		const result = await this.db
			.insertInto("users")
			.values({
				email,
				username,
				password,
				first_name: input.firstName ?? null,
				last_name: input.lastName ?? null,
				tos_accepted: input.tosAccepted ? 1 : 0,
				activated: 0,
				activation_token: activationToken,
				activation_token_expiration: activationExpires,
				disabled: 0,
				created: now,
				updated: now,
			} as any)
			.executeTakeFirst()

		const id = result?.insertId ? Number(result?.insertId) : null
		return id ? { id, activationToken } : { error: "Failed to create user", code: 500 }
	}

	/** Update user fields */
	update = async (userId: number, payload: Partial<UserDBRow>): Promise<UserFull | { error: string; code: number }> => {
		if (!userId) return { error: "User ID required", code: 400 }
		const user = await this.get(userId)
		if (!user) return { error: "User not found", code: 404 }

		const { id, password, deleted_at, ...data } = payload as any
		if (data.username === user.info.username) delete data.username
		if (data.email === user.info.email) delete data.email
		if (!Object.keys(data).length) return user

		await this.db.updateTable("users").set({ ...data, updated: nowUtcDateTime() }).where("id", "=", userId).execute()
		return (await this.get(userId))!
	}

	/** Update password */
	public changePassword = async (userId: number, currentPassword?: string, newPassword?: string, logoutAll = false): Promise<object> => {
		if (!userId || !newPassword) {
			return { error: "User and new password required", code: 400 }
		}

		const user = await api.User.Repo.get(userId)

		if (!user) {
			return { error: "User not found", code: 404 }
		}

		const dbPassword = await this.db.selectFrom("users").select("password")
			.where("id", "=", userId)
			.executeTakeFirst()
			.then((r) => r?.password ?? null)

		if (dbPassword) {
			const matches = await api.Utils.verifyPassword(currentPassword ?? "", dbPassword)
			if (!matches) {
				return { error: "Current password incorrect", code: 401 }
			}
		}

		const hashed = await api.Utils.hashPassword(newPassword)

		await this.db.updateTable("users")
			.set({ password: hashed, updated: nowUtcDateTime() })
			.where("id", "=", userId)
			.execute()

		if (logoutAll) { await api.User.Auth.logoutAllDevices(userId) }
		return { success: true }
	}

	/** Soft delete user */
	delete = async (userId: number): Promise<{}> => {
		if (!userId) return { error: "User ID required", code: 400 }
		const user = await this.get(userId)
		if (!user) return { error: "User not found", code: 404 }

		const result = await this.db.updateTable("users").set({ deleted_at: nowUtcDateTime(), disabled: 1 }).where("id", "=", userId).execute()
		if ("error" in result) return result

		await api.User.TokenStore.revokeAllDevices(userId)

		return { success: true }
	}
}