import type { UserDBRow } from "../../schema/Database.js"
import { nowUtcDateTime } from "./UserDbUtils.js"
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
		return await this.get(validation.user.id!) ?? { error: "User not found", code: 404 }
	}

	/** 
	 * Get user by ID or identifier (email/username)
	 */
	async get(idOrIdentifier: number | string): Promise<UserFull | null> {
		const normalized = normalizeEmail(idOrIdentifier) || normalizeUsername(idOrIdentifier)
		const user = await this.db.selectFrom("users")
			.selectAll()
			.where((eb) => eb.or([
				eb("id", "=", Number(idOrIdentifier)), 
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
			sessions: (sessionsByDevice.get(d.id!) ?? []).map((s) => ({
				id: s.id!,
				valid: s.valid === 1,
				expires: s.expires ?? null,
				created: s.created ?? null,
			})),
		}))

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
				activated: Boolean(user.activated),
				disabled: Boolean(user.disabled),
				deletedAt: user.deleted_at ?? null,
				tosAccepted: Boolean(user.tos_accepted),
				created: user.created,
				updated: user.updated,
			},
			permissions: perms,
			settings: settingRows.map((s) => ({ key: s.key, value: s.value ?? null })),
			devices,
		}
	}
	

	/**
	 * List all non-deleted users
	 */
	list = async (options?: { limit?: number; offset?: number }): Promise<UserFull[]> => {
		// Select IDs of non-deleted users
		let query = this.db.selectFrom("users").select("id").where("deleted_at", "is", null)
		
		if (options?.limit) query = query.limit(options.limit)
		if (options?.offset) query = query.offset(options.offset)
		const results = query.execute() as any

		// Loop through IDs and get full user data
		const users: UserFull[] = []
		for await (const row of results) {
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

	/** Create a new user */
	create = async (input: UserCreateInput): Promise<{ id: number } | { error: string; code: number }> => {
		const email = normalizeEmail(input.email)
		const username = normalizeUsername(input.username)
		if (!email || !username || !input.password) {
			return { error: "Email, username, and password required", code: 400 }
		}

		const existing = await this.exists(email, username)
		if (existing) return { error: "User already exists", code: 409 }

		const password = await api.Utils.hashPassword(input.password)
		const now = nowUtcDateTime()
		const result = await this.db
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

		const id = result?.insertId ? Number(result?.insertId) : null
		return id ? { id } : { error: "Failed to create user", code: 500 }
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