import type {
	UserTokenRefreshDBRow,
	UserTokenAccessDBRow,
	UserTokenBlacklistDBRow,
} from "../../schema/Database.js"
import { extractInsertId, formatUtcDateTime, parseUtcDateTimeMs } from "./UserDbUtils.js"

export class TokenStore {
	private readonly db = api.DB.connection

	getRefreshToken = async (token: string): Promise<UserTokenRefreshDBRow | null> =>
		this.db
			.selectFrom("user_tokens_refresh")
			.selectAll()
			.where("token", "=", token)
			.executeTakeFirst() as any

	getRefreshById = async (id: number): Promise<UserTokenRefreshDBRow | null> =>
		this.db
			.selectFrom("user_tokens_refresh")
			.selectAll()
			.where("id", "=", id)
			.executeTakeFirst() as any

	getAccessToken = async (token: string): Promise<UserTokenAccessDBRow | null> =>
		this.db
			.selectFrom("user_tokens_access")
			.selectAll()
			.where("token", "=", token)
			.executeTakeFirst() as any

	storeRefreshToken = async (options: {
		userId: number
		deviceId: number | null
		token: string
		expires: Date
	}): Promise<number> => {
		const result = await this.db
			.insertInto("user_tokens_refresh")
			.values({
				user_id: options.userId,
				device_id: options.deviceId,
				token: options.token,
				valid: 1,
				expires: formatUtcDateTime(options.expires),
			})
			.executeTakeFirst()

		return extractInsertId(result) ?? 0
	}

	storeAccessToken = async (options: {
		userId: number
		refreshId: number
		token: string
		expires: Date
	}) => {
		await this.db
			.insertInto("user_tokens_access")
			.values({
				user_id: options.userId,
				refresh_token_id: options.refreshId,
				token: options.token,
				expires: formatUtcDateTime(options.expires),
			})
			.executeTakeFirst()
	}

	isBlacklisted = async (token: string) => {
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
		return parseUtcDateTimeMs(entry.expires) > Date.now()
	}

	blacklistToken = async (options: {
		userId: number
		token: string
		tokenType: string
		expires: string
		reason?: string
	}) => {
		const payload: Partial<UserTokenBlacklistDBRow> = {
			user_id: options.userId,
			token: options.token,
			token_type: options.tokenType,
			expires: options.expires,
			reason: options.reason ?? null,
		}

		await this.db.insertInto("user_tokens_blacklist").values(payload as any).execute()
	}

	invalidateRefreshToken = async (row: UserTokenRefreshDBRow, reason: string) => {
		await this.db
			.updateTable("user_tokens_refresh")
			.set({ valid: 0 })
			.where("id", "=", row.id!)
			.execute()

		await this.db.deleteFrom("user_tokens_access").where("refresh_token_id", "=", row.id!).execute()

		await this.blacklistToken({
			userId: row.user_id,
			token: row.token,
			tokenType: "refresh",
			expires: row.expires,
			reason,
		})
	}

	revokeByRefreshToken = async (refreshToken: string, reason = "Logout") => {
		const stored = await this.getRefreshToken(refreshToken)
		if (stored) {
			await this.invalidateRefreshToken(stored, reason)
		}
	}

	revokeByAccessToken = async (accessToken: string, reason = "Logout") => {
		const stored = await this.getAccessToken(accessToken)
		if (!stored) {
			return
		}

		const refresh = await this.getRefreshById(stored.refresh_token_id)
		if (refresh) {
			await this.invalidateRefreshToken(refresh, reason)
		}
	}

	revokeAllDevices = async (userId: number) => {
		await this.db
			.updateTable("user_tokens_refresh")
			.set({ valid: 0 })
			.where("user_id", "=", userId)
			.execute()

		await this.db.deleteFrom("user_tokens_access").where("user_id", "=", userId).execute()
	}

	revokeByDeviceId = async (userId: number, deviceId: number) => {
		await this.db
			.updateTable("user_tokens_refresh")
			.set({ valid: 0 })
			.where("user_id", "=", userId)
			.where("device_id", "=", deviceId)
			.execute()

		// Access tokens are CASCADE-deleted when device row is removed,
		// but clean up any that reference invalidated refresh tokens
		const refreshIds = await this.db
			.selectFrom("user_tokens_refresh")
			.select("id")
			.where("user_id", "=", userId)
			.where("device_id", "=", deviceId)
			.execute()

		for (const r of refreshIds) {
			await this.db.deleteFrom("user_tokens_access").where("refresh_token_id", "=", r.id!).execute()
		}
	}

	revokeAllUsers = async () => {
		await this.db.updateTable("user_tokens_refresh").set({ valid: 0 }).execute()
		await this.db.deleteFrom("user_tokens_access").execute()
	}
}
