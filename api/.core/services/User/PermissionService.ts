export class PermissionService {
	private readonly db = api.DB.connection

	// Implicit permissions granted to all authenticated users
	private readonly implicitPerms = new Set(["user"])

	// Permissions that bypass all other checks
	private readonly bypassPerms = new Set(["administrator", "admin"])

	hasPermissions = async (userId: number, perms: readonly string[]): Promise<boolean> => {
		if (!perms.length) return true

		// Check if all requested perms are implicit (no DB lookup needed)
		if (perms.every((p) => this.implicitPerms.has(p))) return true

		const userPerms = await this.getUserPermissions(userId)

		// Admin bypass - if user has any bypass perm, grant everything
		if ([...this.bypassPerms].some((bp) => userPerms.has(bp))) return true

		// Check each requested permission
		return perms.every((perm) => this.implicitPerms.has(perm) || this.matchPermission(perm, userPerms))
	}

	hasAnyPermission = async (userId: number, perms: readonly string[]): Promise<boolean> => {
		if (!perms.length) return false

		const userPerms = await this.getUserPermissions(userId)

		// Admin bypass
		if ([...this.bypassPerms].some((bp) => userPerms.has(bp))) return true

		return perms.some((perm) => this.implicitPerms.has(perm) || this.matchPermission(perm, userPerms))
	}

	getUserPermissions = async (userId: number): Promise<Set<string>> => {
		const rows = await this.db
			.selectFrom("user_permissions")
			.select(["name"])
			.where("user_id", "=", userId)
			.execute()
		return new Set(rows.map((r) => r.name))
	}

	listPermissions = async (userId: number): Promise<string[]> => {
		const dbPerms = await this.getUserPermissions(userId)
		return [...this.implicitPerms, ...dbPerms]
	}

	grantPermission = async (userId: number, perm: string): Promise<boolean> => {
		if (this.implicitPerms.has(perm)) return true // Already implicit
		const existing = await this.db
			.selectFrom("user_permissions")
			.select(["id"])
			.where("user_id", "=", userId)
			.where("name", "=", perm)
			.executeTakeFirst()
		if (existing) return true

		await this.db
			.insertInto("user_permissions")
			.values({ user_id: userId, name: perm, value: "1" })
			.execute()
		return true
	}

	revokePermission = async (userId: number, perm: string): Promise<boolean> => {
		if (this.implicitPerms.has(perm)) return false // Can't revoke implicit
		await this.db
			.deleteFrom("user_permissions")
			.where("user_id", "=", userId)
			.where("name", "=", perm)
			.execute()
		return true
	}

	isAdmin = async (userId: number): Promise<boolean> => {
		const perms = await this.getUserPermissions(userId)
		return [...this.bypassPerms].some((bp) => perms.has(bp))
	}

	// Supports wildcards: "posts.*" matches "posts.create", "posts.delete" etc
	private matchPermission(requested: string, granted: Set<string>): boolean {
		if (granted.has(requested)) return true

		// Check wildcards in granted perms
		for (const perm of granted) {
			if (perm.endsWith(".*")) {
				const prefix = perm.slice(0, -1) // "posts.*" -> "posts."
				if (requested.startsWith(prefix)) return true
			}
		}
		return false
	}
}
