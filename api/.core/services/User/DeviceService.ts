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
}
