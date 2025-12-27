export class PermissionService {
	private readonly db = api.DB.connection

	hasPermissions = async (userId: number, perms: readonly string[]) => {
		if (!perms.length) return true
		const rows = await this.db
			.selectFrom("user_permissions")
			.select(["name"])
			.where("user_id", "=", userId)
			.where("name", "in", perms as string[])
			.execute()
		const granted = new Set(rows.map((row) => row.name))
		return perms.every((perm) => granted.has(perm))
	}
}
