import type { Request } from "express"

export class PermissionRoute {
	private readonly route = "permissions"
	private readonly adminOptions = { protected: true, perms: ["administrator"] }

	public routes = async () => {
		// Permission definition management (admin only)
		api.Router.set("GET", this.route, this.listDefined, this.adminOptions)
		api.Router.set("POST", this.route, this.define, this.adminOptions)
		api.Router.set("PUT", this.route, this.update, this.adminOptions)
		api.Router.set("DELETE", this.route, this.undefine, this.adminOptions)

		// User permission management (admin only)
		api.Router.set("GET", `${this.route}/user/:userId`, this.listUser, this.adminOptions)
		api.Router.set("POST", `${this.route}/user/:userId/grant`, this.grant, this.adminOptions)
		api.Router.set("POST", `${this.route}/user/:userId/revoke`, this.revoke, this.adminOptions)
	}

	listDefined = async () => {
		const perms = await api.User.Auth.permissions.listDefined()
		return { permissions: perms }
	}

	define = async (_$: any, req: Request) => {
		const $ = api.Router.getParams(req)
		const key = $.body.key ?? $.body.name
		const value = $.body.value ?? null
		if (!key) return { error: "Permission key required", code: 400 }

		const created = await api.User.Auth.permissions.define(key, value)
		return created
			? { success: true, key }
			: { error: "Permission already exists", code: 409 }
	}

	update = async (_$: any, req: Request) => {
		const $ = api.Router.getParams(req)
		const id = $.body.id ? Number($.body.id) : null
		const key = $.body.key ?? $.body.name
		const value = $.body.value ?? null
		if (!id && !key) return { error: "Permission key or id required", code: 400 }

		const updated = await api.User.Auth.permissions.update(id ?? key, value)
		return updated
			? { success: true }
			: { error: "Permission not found", code: 404 }
	}

	undefine = async (_$: any, req: Request) => {
		const $ = api.Router.getParams(req)
		const id = $.body.id ? Number($.body.id) : null
		const key = $.body.key ?? $.body.name ?? $.params.key
		if (!id && !key) return { error: "Permission key or id required", code: 400 }

		const deleted = await api.User.Auth.permissions.undefine(id ?? key)
		return deleted
			? { success: true }
			: { error: "Cannot remove implicit/bypass permission", code: 400 }
	}

	listUser = async (_$: any, req: Request) => {
		const userId = Number(req.params.userId)
		if (!userId) return { error: "User ID required", code: 400 }

		const perms = await api.User.Auth.permissions.list(userId)
		return { userId, permissions: perms }
	}

	grant = async (_$: any, req: Request) => {
		const $ = api.Router.getParams(req)
		const userId = Number(req.params.userId)
		const perms = $.body.permissions ?? $.body.perm ?? $.body.key
		if (!userId) return { error: "User ID required", code: 400 }
		if (!perms) return { error: "Permission(s) required", code: 400 }

		const result = await api.User.Auth.permissions.grant(userId, perms)
		return result
	}

	revoke = async (_$: any, req: Request) => {
		const $ = api.Router.getParams(req)
		const userId = Number(req.params.userId)
		const perms = $.body.permissions ?? $.body.perm ?? $.body.key
		if (!userId) return { error: "User ID required", code: 400 }
		if (!perms) return { error: "Permission(s) required", code: 400 }

		const revoked = await api.User.Auth.permissions.revoke(userId, perms)
		return { success: revoked }
	}
}
