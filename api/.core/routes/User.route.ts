import type { Request, Response } from "express"
import type { $ } from "../types/routes.js"
import type { UserDeviceContext } from "../schema/AuthShapes.js"
import { CrudMethods } from "../services/CrudMethods.js"
import { User } from "../schema/DomainShapes.js"
import { UserDBRow } from "../schema/Database.js"


export class AuthRoute {
	private readonly userRoute = "account"
	private readonly authRoute = `${this.userRoute}/auth`
	private readonly CRUD = new CrudMethods<User, UserDBRow>()
	private readonly tableName: string = "users"
	private readonly adminOptions = { protected: true, tableName: this.tableName, perms: ["administrator"] }
	private readonly userOptions = { protected: true, tableName: this.tableName, perms: ["user"] }

	public routes = async () => {
		// Auth routes
		api.Router.set(["POST"], `${this.authRoute}/password`, this.changePassword, this.userOptions)
		api.Router.set(["POST"], `${this.authRoute}/refresh`, this.refresh)
		api.Router.set(["POST"], `${this.authRoute}/login`, this.login)
		api.Router.set(["POST"], `${this.authRoute}/vendor/:vendor/login`, this.vendorLogin)
		api.Router.set(["POST"], `${this.authRoute}/vendor/:vendor`, this.vendorInfo)
		api.Router.set(["POST"], `${this.userRoute}/register`, this.register)
		api.Router.set(["POST"], `${this.authRoute}/logout`, this.logout, this.userOptions)
		api.Router.set(["POST"], `${this.authRoute}/logout/all-devices`, this.logoutAllDevices, this.userOptions)
		api.Router.set(["POST"], `${this.authRoute}/logout/all-users`, this.logoutAllUsers, this.adminOptions)

		// User routes
		api.Router.set(["POST"], `${this.userRoute}/me`, this.me, this.userOptions)
		api.Router.set(["POST"], `${this.userRoute}/profile`, this.updateProfile, this.userOptions)

		// CRUD routes
		api.Router.set("GET", `${this.userRoute}/user`, this.get, this.adminOptions)
		api.Router.set("PUT", `${this.userRoute}/user`, this.update, this.adminOptions)
		api.Router.set("DELETE", `${this.userRoute}/user`, this.delete, this.adminOptions)
		api.Router.set("POST", `${this.userRoute}/user`, this.create, this.adminOptions)
		api.Router.set("GET", `${this.userRoute}/users`, this.getMany, this.adminOptions)
	}

	private parseAccessToken = (headers: Record<string, any>): string | null => {
		const raw = (headers.authorization ?? headers.Authorization ?? "") as string
		if (!raw || typeof raw !== "string") { return null }
		const [scheme, token] = raw.split(" ")
		if (scheme?.toLowerCase() !== "bearer" || !token) { return null }
		return token.trim()
	}

	private buildDevice(body: Record<string, any>, request: Request): UserDeviceContext {
		return {
			fingerprint: body.fingerprint ?? null,
			userAgent: request.headers["user-agent"] as string | undefined,
			ip: request.ip,
			name: body.device_name ?? body.device ?? null,
			customName: body.custom_name ?? null,
		}
	}

	get = async ($: any, req: Request) => {
		const params = api.Router.getParams(req, this.tableName)
		if(params.isEmpty) { return { code: 422, error: 'Missing request data' } }
		return await this.CRUD.get(this.tableName, params.params)
	}

	getMany = async ($: any, req: Request) => {
		const params = api.Router.getParams(req, this.tableName)
		return await this.CRUD.getMany(this.tableName, params.params)
	}

	update = async ($: any, req: Request) => {
		const params = api.Router.getParams(req, this.tableName)
		if(params.isEmpty) { return { code: 422, error: 'Missing request data' } }
		return await this.CRUD.update(this.tableName, params.params, params.body)
	}

	create = async ($: any, req: Request) => {
		const params = api.Router.getParams(req, this.tableName)
		if(params.isEmpty) { return { code: 422, error: 'Missing request data' } }
		return await this.CRUD.create(this.tableName, params.params)
	}

	delete = async ($: any, req: Request) => {
		const params = api.Router.getParams(req, this.tableName)
		if(params.isEmpty) { return { code: 422, error: 'Missing request data' } }
		return await this.CRUD.delete(this.tableName, params.params)
	}

	login = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		return await api.User.Auth.login({
			identifier: $.body.identifier,
			email: $.body.email,
			username: $.body.username,
			password: $.body.password,
			device: this.buildDevice($.body, req),
		})
	}

	register = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		return await api.User.Auth.register(
			{
				email: $.body.email,
				username: $.body.username,
				password: $.body.password,
				firstName: $.body.first_name,
				lastName: $.body.last_name,
				tosAccepted: Boolean($.body.tos_accepted ?? false),
			},
			this.buildDevice($.body, req)
		)
	}

	me = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		return await api.User.Auth.me(token ?? "")
	}

	// WIP
	refresh = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		return $.body.refresh_token ?? ""
	}

	logout = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const refreshToken = $.body.refresh_token ?? ""
		const accessToken = this.parseAccessToken($.headers as Record<string, any>) ?? undefined
		return await api.User.Auth.logout(refreshToken || undefined, accessToken)
	}

	logoutAllDevices = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		const me = token ? await api.User.Auth.me(token) : null
		const userId = me && "user" in me ? me.user.id : undefined
		return userId ? await api.User.Auth.logoutAllDevices(userId) : { error: "User not resolved", code: 400 }
	}

	logoutAllUsers = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		return await api.User.Auth.logoutAllUsers()
	}

	changePassword = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		const me = token ? await api.User.Auth.me(token) : null
		if (!me || (me as any).error) {
			return me ?? { error: "Unauthorized", code: 401 }
		}

		const userId = (me as any).user?.id
		if (!userId) return { error: "Unauthorized", code: 401 }

		return await api.User.Auth.changePassword({
			userId,
			currentPassword: $.body.current_password ?? "",
			newPassword: $.body.new_password ?? "",
			logoutAll: $.body.logout_all ?? true,
		})
	}

	updateProfile = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		const me = token ? await api.User.Auth.me(token) : null
		if (!me || (me as any).error) {
			return me ?? { error: "Unauthorized", code: 401 }
		}

		const userId = (me as any).user?.id
		if (!userId) return { error: "Unauthorized", code: 401 }

		return await api.User.Auth.updateProfile(userId, {
			first_name: $.body.first_name ?? null,
			last_name: $.body.last_name ?? null,
			phone: $.body.phone ?? null,
			company: $.body.company ?? null,
			address: $.body.address ?? null,
		})
	}

	vendorInfo = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const vendor = $.params?.vendor as string | null
		return vendor ? api.User.Auth.getVendorInfo(vendor) : { error: "Unknown vendor", code: 404 }
	}

	vendorLogin = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const vendor = $.params?.vendor as string | null
		if (!vendor) { return { error: "Unknown vendor", code: 404 } }
		return await api.User.Auth.vendorLogin({
			vendor,
			payload: $.body ?? {},
		})
	}
}