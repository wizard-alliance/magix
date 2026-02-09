import type { UserDeviceDBRow } from "../../schema/Database.js"
import type { UserDeviceContext } from "../../schema/AuthShapes.js"
import { extractInsertId, nowUtcDateTime } from "./UserDbUtils.js"

export class DeviceService {
	private readonly db = api.DB.connection

	upsertDevice = async (userId: number, device?: UserDeviceContext): Promise<number | null> => {
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
			last_login: nowUtcDateTime(),
			updated: nowUtcDateTime(),
		}

		if (existing?.id) {
			// Preserve custom_name if already set and not explicitly provided
			if (existing.custom_name && !device.customName) {
				delete payload.custom_name
			}
			await this.db
				.updateTable("user_devices")
				.set(payload)
				.where("id", "=", existing.id)
				.execute()
			return existing.id
		}

		const result = await this.db.insertInto("user_devices").values(payload as any).executeTakeFirst()
		return extractInsertId(result)
	}

	renameDevice = async (userId: number, deviceId: number, customName: string): Promise<{ success: boolean } | { error: string; code?: number }> => {
		const device = await this.db
			.selectFrom("user_devices")
			.selectAll()
			.where("id", "=", deviceId)
			.where("user_id", "=", userId)
			.executeTakeFirst()

		if (!device) return { error: "Device not found", code: 404 }

		await this.db
			.updateTable("user_devices")
			.set({ custom_name: customName, updated: nowUtcDateTime() })
			.where("id", "=", deviceId)
			.execute()

		return { success: true }
	}

	deleteDevice = async (userId: number, deviceId: number) => {
		await this.db
			.deleteFrom("user_devices")
			.where("id", "=", deviceId)
			.where("user_id", "=", userId)
			.execute()
	}

	updateDevice = async (userId: number, deviceId: number, context: Partial<UserDeviceContext>) => {
		const updates: Record<string, any> = { updated: nowUtcDateTime() }
		if (context.fingerprint) updates.fingerprint = context.fingerprint
		if (context.name) updates.name = context.name
		if (context.userAgent) updates.user_agent = context.userAgent
		if (context.ip) updates.ip = context.ip

		await this.db
			.updateTable("user_devices")
			.set(updates)
			.where("id", "=", deviceId)
			.where("user_id", "=", userId)
			.execute()

		return { success: true }
	}
}
