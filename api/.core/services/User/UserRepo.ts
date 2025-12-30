import type { UserDBRow } from "../../schema/Database.js"
import type { RegisterInput } from "../../schema/AuthShapes.js"
import { extractInsertId, nowUtcDateTime } from "./UserDbUtils.js"

export const normalizeEmail = (value?: string | null) => (value ?? "").trim().toLowerCase()
export const normalizeUsername = (value?: string | null) => (value ?? "").trim()

export class UserRepo {
	private readonly db = api.DB.connection

	findById = async (id: number): Promise<UserDBRow | null> =>
		this.db.selectFrom("users").selectAll().where("id", "=", id).executeTakeFirst() as any

	findByIdentifier = async (identifier: string): Promise<UserDBRow | null> => {
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

	findByEmailOrUsername = async (email?: string, username?: string): Promise<UserDBRow | null> => {
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

	createLocalUser = async (input: {
		email: string
		username: string
		password: string
		register: RegisterInput
	}): Promise<number | null> => {
		const now = nowUtcDateTime()
		const insertResult = await this.db
			.insertInto("users")
			.values({
				email: input.email,
				username: input.username,
				password: input.password,
				first_name: input.register.firstName ?? null,
				last_name: input.register.lastName ?? null,
				tos_accepted: input.register.tosAccepted ? 1 : 0,
				activated: 1,
				disabled: 0,
				created: now,
				updated: now,
			} as any)
			.executeTakeFirst()
		return extractInsertId(insertResult)
	}

	updatePassword = async (userId: number, password: string) => {
		await this.db
			.updateTable("users")
			.set({ password, updated: nowUtcDateTime() })
			.where("id", "=", userId)
			.execute()
	}

	updateProfile = async (userId: number, payload: Partial<UserDBRow>): Promise<UserDBRow | null> => {
		const allowed: Partial<UserDBRow> = {
			first_name: payload.first_name ?? null,
			last_name: payload.last_name ?? null,
			phone: payload.phone ?? null,
			company: payload.company ?? null,
			address: payload.address ?? null,
		}

		await this.db
			.updateTable("users")
			.set({ ...allowed, updated: nowUtcDateTime() })
			.where("id", "=", userId)
			.execute()

		return await this.findById(userId)
	}
}
