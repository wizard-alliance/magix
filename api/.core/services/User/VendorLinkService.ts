import type { UserVendorDBRow } from "../../schema/Database.js"
import type { UserVendorLink } from "../../schema/DomainShapes.js"
import type { VendorProfile } from "../../schema/AuthShapes.js"
import { extractInsertId, nowUtcDateTime } from "./UserDbUtils.js"
import { randomUUID } from "crypto"

const toShape = (row: UserVendorDBRow): UserVendorLink => ({
	id: row.id!,
	vendor: row.vendor,
	vendorUserId: row.vendor_user_id,
	vendorEmail: row.vendor_email ?? null,
	vendorUsername: row.vendor_username ?? null,
	created: row.created ?? null,
})

export class VendorLinkService {
	private readonly db = api.DB.connection

	// In-memory store for pending connect-vendor tokens (5 min TTL)
	private pending = new Map<string, { vendor: string, profile: VendorProfile, expiresAt: number }>()

	findByVendor = async (vendor: string, vendorUserId: string): Promise<UserVendorDBRow | null> => {
		return await this.db
			.selectFrom("user_vendors").selectAll()
			.where("vendor", "=", vendor)
			.where("vendor_user_id", "=", vendorUserId)
			.executeTakeFirst() ?? null
	}

	getLinked = async (userId: number): Promise<UserVendorLink[]> => {
		const rows = await this.db
			.selectFrom("user_vendors").selectAll()
			.where("user_id", "=", userId)
			.execute()
		return rows.map(toShape)
	}

	link = async (userId: number, vendor: string, profile: VendorProfile): Promise<number | null> => {
		try {
			const result = await this.db.insertInto("user_vendors").values({
				user_id: userId,
				vendor,
				vendor_user_id: profile.id,
				vendor_email: profile.email || null,
				vendor_username: profile.username || null,
				created: nowUtcDateTime(),
			} as any).executeTakeFirst()
			return extractInsertId(result)
		} catch (e: any) {
			// Duplicate — update instead
			if (e?.code === "ER_DUP_ENTRY") {
				await this.db.updateTable("user_vendors")
					.set({ vendor_email: profile.email || null, vendor_username: profile.username || null })
					.where("user_id", "=", userId)
					.where("vendor", "=", vendor)
					.execute()
				return null
			}
			throw e
		}
	}

	unlink = async (userId: number, vendor: string) => {
		await this.db
			.deleteFrom("user_vendors")
			.where("user_id", "=", userId)
			.where("vendor", "=", vendor)
			.execute()
	}

	storePending = (vendor: string, profile: VendorProfile): string => {
		const token = randomUUID()
		this.pending.set(token, { vendor, profile, expiresAt: Date.now() + 5 * 60_000 })
		return token
	}

	consumePending = (token: string): { vendor: string, profile: VendorProfile } | null => {
		const entry = this.pending.get(token)
		if (!entry) return null
		this.pending.delete(token)
		if (Date.now() > entry.expiresAt) return null
		return { vendor: entry.vendor, profile: entry.profile }
	}
}
