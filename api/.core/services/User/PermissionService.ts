export class PermissionService {
	private readonly db = api.DB.connection

	// Implicit permissions granted to all authenticated users
	private readonly implicitPerms = new Set(["user"])

	// Permissions that bypass all other checks
	private readonly bypassPerms = new Set(["administrator", "admin"])

	has = async (userId: number, perms: readonly string[]): Promise<boolean> => {
		if (!perms.length) return true

		// Check if all requested perms are implicit (no DB lookup needed)
		if (perms.every((p) => this.implicitPerms.has(p))) return true

		const userPerms = await this.get(userId)

		// Admin bypass - if user has any bypass perm, grant everything
		if ([...this.bypassPerms].some((bp) => userPerms.has(bp))) return true

		// Check each requested permission
		return perms.every((perm) => this.implicitPerms.has(perm) || this.match(perm, userPerms))
	}

	hasAny = async (userId: number, perms: readonly string[]): Promise<boolean> => {
		if (!perms.length) return false

		const userPerms = await this.get(userId)

		// Admin bypass
		if ([...this.bypassPerms].some((bp) => userPerms.has(bp))) return true

		return perms.some((perm) => this.implicitPerms.has(perm) || this.match(perm, userPerms))
	}

	get = async (userId: number): Promise<Set<string>> => {
		const rows = await this.db
			.selectFrom("user_permissions")
			.select(["name"])
			.where("user_id", "=", userId)
			.execute()
		return new Set(rows.map((r) => r.name))
	}

	list = async (userId: number): Promise<string[]> => {
		const dbPerms = await this.get(userId)
		return [...this.implicitPerms, ...dbPerms]
	}

	grant = async (userId: number, perm: string | string[]): Promise<boolean> => {
		const perms = Array.isArray(perm) ? perm : [perm]
		for (const p of perms) {
			if (this.implicitPerms.has(p)) continue
			const existing = await this.db
				.selectFrom("user_permissions")
				.select(["id"])
				.where("user_id", "=", userId)
				.where("name", "=", p)
				.executeTakeFirst()
			if (existing) continue

			await this.db
				.insertInto("user_permissions")
				.values({ user_id: userId, name: p, value: "1" })
				.execute()
		}
		return true
	}

	revoke = async (userId: number, perm: string | string[]): Promise<boolean> => {
		const perms = Array.isArray(perm) ? perm : [perm]
		const toRevoke = perms.filter((p) => !this.implicitPerms.has(p))
		if (!toRevoke.length) return false

		await this.db
			.deleteFrom("user_permissions")
			.where("user_id", "=", userId)
			.where("name", "in", toRevoke)
			.execute()
		return true
	}

	isAdmin = async (userId: number): Promise<boolean> => {
		const perms = await this.get(userId)
		return [...this.bypassPerms].some((bp) => perms.has(bp))
	}

	/**
	 * Check if user can perform action on a resource, considering ownership.
	 * Convention: "resource.action.own" allows self-access, "resource.action" or "resource.action.any" allows all.
	 * @example canAccess(userId, targetId, "users.read") // checks users.read.own if self, users.read otherwise
	 */
	canAccess = async (userId: number, targetId: number, action: string): Promise<boolean> => {
		const isOwn = userId === targetId

		// If accessing own resource, check for .own or general permission
		if (isOwn) {
			const hasOwn = await this.has(userId, [`${action}.own`])
			if (hasOwn) return true
		}

		// Check general permission (allows any)
		return this.has(userId, [action])
	}

	// Supports wildcards: "posts.*" matches "posts.create", "posts.delete" etc
	private match(requested: string, granted: Set<string>): boolean {
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
