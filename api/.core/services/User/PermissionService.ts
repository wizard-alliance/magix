export class PermissionService {
	private readonly db = api.DB.connection
	private readonly prefix = "PermissionService"

	// Implicit permissions granted to all authenticated users
	private readonly implicitPerms = new Set(["user"])

	// Permissions that bypass all other checks
	private readonly bypassPerms = new Set(["administrator", "admin"])

	// Cache for defined permissions (refreshed on changes)
	private definedPermsCache: Set<string> | null = null

	// Normalize permission key: user_read → user.read, UserRead → user.read
	private normalize = (perm: string): string =>
		perm.toLowerCase().replace(/[_\s]+/g, ".")

	// Get all defined permissions from DB
	getDefined = async (): Promise<Set<string>> => {
		if (this.definedPermsCache) return this.definedPermsCache
		const rows = await this.db
			.selectFrom("permissions")
			.select(["key"])
			.execute()
		this.definedPermsCache = new Set([...this.implicitPerms, ...this.bypassPerms, ...rows.map((r) => r.key)])
		return this.definedPermsCache
	}

	// List all defined permissions with metadata
	listDefined = async (): Promise<Array<{ key: string; value: string | null }>> => {
		const rows = await this.db
			.selectFrom("permissions")
			.select(["key", "value"])
			.execute()
		return rows
	}

	// Define a new permission
	define = async (key: string, value?: string): Promise<boolean> => {
		const normalized = this.normalize(key)
		const existing = await this.db
			.selectFrom("permissions")
			.select(["ID"])
			.where("key", "=", normalized)
			.executeTakeFirst()
		if (existing) return false

		await this.db
			.insertInto("permissions")
			.values({ key: normalized, value: value ?? null })
			.execute()
		this.definedPermsCache = null
		return true
	}

	// Update permission metadata
	update = async (keyOrId: string | number, value: string | null): Promise<boolean> => {
		const key = typeof keyOrId === "number" ? await this.getKeyById(keyOrId) : keyOrId
		if (!key) return false
		const normalized = this.normalize(key)
		const result = await this.db
			.updateTable("permissions")
			.set({ value })
			.where("key", "=", normalized)
			.executeTakeFirst()
		return (result?.numUpdatedRows ?? 0n) > 0n
	}

	// Remove a defined permission
	undefine = async (keyOrId: string | number): Promise<boolean> => {
		const key = typeof keyOrId === "number" ? await this.getKeyById(keyOrId) : keyOrId
		if (!key) return false
		const normalized = this.normalize(key)
		if (this.implicitPerms.has(normalized) || this.bypassPerms.has(normalized)) return false
		await this.db.deleteFrom("permissions").where("key", "=", normalized).execute()
		this.definedPermsCache = null
		return true
	}

	// Get permission key by ID
	private getKeyById = async (id: number): Promise<string | null> => {
		const row = await this.db.selectFrom("permissions").select("key").where("ID", "=", id).executeTakeFirst()
		return row?.key ?? null
	}

	// Check if a permission is defined (valid)
	isDefined = async (perm: string): Promise<boolean> => {
		const normalized = this.normalize(perm)
		if (this.implicitPerms.has(normalized) || this.bypassPerms.has(normalized)) return true
		// Wildcards always allowed
		if (normalized.endsWith(".*")) return true
		const defined = await this.getDefined()
		return defined.has(normalized)
	}

	has = async (userId: number, perms: readonly string[]): Promise<boolean> => {
		if (!perms.length) return true

		// Check if all requested perms are implicit (no DB lookup needed)
		if (perms.every((p) => this.implicitPerms.has(this.normalize(p)))) return true

		const userPerms = await this.get(userId)

		// Admin bypass - if user has any bypass perm, grant everything
		if ([...this.bypassPerms].some((bp) => userPerms.has(bp))) return true

		// Check each requested permission
		return perms.every((perm) => {
			const n = this.normalize(perm)
			return this.implicitPerms.has(n) || this.match(n, userPerms)
		})
	}

	hasAny = async (userId: number, perms: readonly string[]): Promise<boolean> => {
		if (!perms.length) return false

		const userPerms = await this.get(userId)

		// Admin bypass
		if ([...this.bypassPerms].some((bp) => userPerms.has(bp))) return true

		return perms.some((perm) => {
			const n = this.normalize(perm)
			return this.implicitPerms.has(n) || this.match(n, userPerms)
		})
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

	grant = async (userId: number, perm: string | string[]): Promise<{ granted: string[]; invalid: string[] }> => {
		const perms = (Array.isArray(perm) ? perm : [perm]).map(this.normalize)
		const granted: string[] = []
		const invalid: string[] = []

		for (const p of perms) {
			if (this.implicitPerms.has(p)) {
				granted.push(p)
				continue
			}

			// Validate permission exists
			const defined = await this.isDefined(p)
			if (!defined) {
				invalid.push(p)
				api.Log(`Attempted to grant undefined permission: "${p}"`, this.prefix, "warning")
				continue
			}

			const existing = await this.db
				.selectFrom("user_permissions")
				.select(["id"])
				.where("user_id", "=", userId)
				.where("name", "=", p)
				.executeTakeFirst()
			if (existing) {
				granted.push(p)
				continue
			}

			await this.db
				.insertInto("user_permissions")
				.values({ user_id: userId, name: p, value: "1" })
				.execute()
			granted.push(p)
		}
		return { granted, invalid }
	}

	revoke = async (userId: number, perm: string | string[]): Promise<boolean> => {
		const perms = (Array.isArray(perm) ? perm : [perm]).map(this.normalize)
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

	canAccess = async (userId: number, targetId: number, action: string): Promise<boolean> => {
		const isOwn = userId === targetId
		const normalized = this.normalize(action)

		if (isOwn) {
			const hasOwn = await this.has(userId, [`${normalized}.own`])
			if (hasOwn) return true
		}

		return this.has(userId, [normalized])
	}

	private match(requested: string, granted: Set<string>): boolean {
		if (granted.has(requested)) return true

		for (const perm of granted) {
			if (perm.endsWith(".*")) {
				const prefix = perm.slice(0, -1)
				if (requested.startsWith(prefix)) return true
			}
		}
		return false
	}
}
