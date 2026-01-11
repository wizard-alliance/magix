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
		api.Router.set(["GET"], `${this.authRoute}/vendor/:vendor/redirect`, this.vendorRedirect)
		api.Router.set(["GET"], `${this.authRoute}/vendor/:vendor/callback`, this.vendorCallback)
		api.Router.set(["POST"], `${this.userRoute}/register`, this.register)
		api.Router.set(["POST"], `${this.authRoute}/logout`, this.logout, this.userOptions)
		api.Router.set(["POST"], `${this.authRoute}/logout/all-devices`, this.logoutAllDevices, this.userOptions)
		api.Router.set(["POST"], `${this.authRoute}/logout/all-users`, this.logoutAllUsers, this.adminOptions)

		// Password reset & account activation
		api.Router.set(["POST"], `${this.userRoute}/reset`, this.requestReset)
		api.Router.set(["POST"], `${this.userRoute}/reset/confirm`, this.confirmReset)
		api.Router.set(["GET"], `${this.userRoute}/confirm`, this.confirmActivation)

		// User routes
		api.Router.set(["POST"], `${this.userRoute}/me`, this.me, this.userOptions)

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
		const p = api.Router.getParams(req, this.tableName)
		const id = Number(p.params.id ?? p.query.id)
		if (!id) return { code: 422, error: "User ID required" }
		return await api.User.Repo.get(id) ?? { code: 404, error: "User not found" }
	}

	getMany = async ($: any, req: Request) => {
		const p = api.Router.getParams(req, this.tableName)
		return await api.User.Repo.list({ limit: Number(p.query.limit) || 100, offset: Number(p.query.offset) || 0 })
	}

	update = async ($: any, req: Request) => {
		const p = api.Router.getParams(req, this.tableName)
		const id = Number(p.params.id ?? p.query.id ?? p.body.id)
		if (!id) return { code: 422, error: "User ID required" }
		// Filter out id and empty values
		const data: Record<string, any> = {}
		for (const [k, v] of Object.entries(p.body)) {
			if (k !== "id" && v !== "" && v !== null && v !== undefined) data[k] = v
		}
		return await api.User.Repo.update(id, data)
	}

	create = async ($: any, req: Request) => {
		const p = api.Router.getParams(req, this.tableName)
		return await api.User.Repo.create({
			email: p.body.email,
			username: p.body.username,
			password: p.body.password,
			firstName: p.body.first_name,
			lastName: p.body.last_name,
		})
	}

	delete = async ($: any, req: Request) => {
		const p = api.Router.getParams(req, this.tableName)
		const id = Number(p.params.id ?? p.query.id ?? p.body.id)
		if (!id) return { code: 422, error: "User ID required" }
		return await api.User.Repo.delete(id)
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
		return await api.User.Repo.me(token ?? "")
	}

	refresh = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const refreshToken = $.body.refresh_token ?? $.body.refreshToken ?? ""
		return await api.User.Auth.refresh(refreshToken)
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
		const me = token ? await api.User.Repo.me(token) : null
		const userId = me && "id" in me ? me.id : undefined
		return userId ? await api.User.Auth.logoutAllDevices(userId) : { error: "User not resolved", code: 400 }
	}

	logoutAllUsers = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		return await api.User.Auth.logoutAllUsers()
	}

	changePassword = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		const me = token ? await api.User.Repo.me(token) : null
		if (!me || "error" in me) return me ?? { error: "Unauthorized", code: 401 }

		return await api.User.Repo.changePassword(
			me.id,
			$.body.current_password ?? "",
			$.body.new_password ?? "",
			$.body.logout_all ?? true,
		)
	}

	vendorInfo = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const vendor = api.User.Vendors.get($.params?.vendor as string)
		return vendor ? { vendor: vendor.info() } : { error: "Unknown vendor", code: 404 }
	}

	vendorRedirect = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const vendorName = $.params?.vendor as string | null
		const returnUrl = (req.query.returnUrl as string) || (req.query.return_url as string) || "/"

		if (!vendorName) {
			return { error: "Unknown vendor", code: 404 }
		}

		const vendor = api.User.Vendors.get(vendorName)
		if (!vendor || !vendor.isEnabled()) {
			return { error: "Vendor not enabled", code: 400 }
		}

		const state = api.User.Vendors.encodeState({
			returnUrl,
			csrf: crypto.randomUUID(),
			vendor: vendorName,
		})

		const authorizeUrl = vendor.buildAuthorizeUrl(state)
		res.redirect(authorizeUrl)
		return null
	}

	vendorCallback = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const vendorName = $.params?.vendor as string | null
		const code = req.query.code as string | undefined
		const stateParam = req.query.state as string | undefined
		const error = req.query.error as string | undefined

		const state = stateParam ? api.User.Vendors.decodeState(stateParam) : null
		const returnUrl = state?.returnUrl || "/"

		const buildRedirect = (base: string, params: Record<string, string>) => {
			const url = new URL(base)
			for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
			return url.toString()
		}

		const redirectError = (msg: string) => {
			res.redirect(buildRedirect(returnUrl, { error: msg }))
			return null
		}

		if (error) {
			return redirectError(error)
		}

		if (!vendorName || !code || !state) {
			return redirectError("invalid_request")
		}

		const vendor = api.User.Vendors.get(vendorName)
		if (!vendor || !vendor.isEnabled()) {
			return redirectError("vendor_disabled")
		}

		// Exchange code for access token
		const tokenResult = await vendor.exchangeCode(code)
		if (tokenResult.error || !tokenResult.access_token) {
			return redirectError(tokenResult.error ?? "token_exchange_failed")
		}

		// Fetch user profile from provider
		const profile = await vendor.fetchProfile(tokenResult.access_token)
		if (!profile) {
			return redirectError("profile_fetch_failed")
		}

		// Login/register user
		const authResult = await api.User.Auth.vendorLogin({ vendor: vendorName, payload: profile })
		if ("error" in authResult) {
			return redirectError(authResult.error)
		}

		// Redirect with tokens
		res.redirect(buildRedirect(returnUrl, {
			access_token: authResult.tokens.access.token,
			access_expires: authResult.tokens.access.expiresAt.toISOString(),
			refresh_token: authResult.tokens.refresh.token,
			refresh_expires: authResult.tokens.refresh.expiresAt.toISOString(),
		}))
		return null
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

	requestReset = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		return await api.User.Auth.requestPasswordReset($.body.email ?? "")
	}

	confirmReset = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		return await api.User.Auth.confirmPasswordReset(
			$.body.token ?? "",
			$.body.password ?? $.body.new_password ?? ""
		)
	}

	confirmActivation = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = (req.query.token as string) ?? $.body.token ?? ""
		const result = await api.User.Auth.confirmActivation(token)

		// For GET requests, redirect to login page with message
		if (req.method === "GET") {
			const baseUrl = api.Config("WEB_URL") || "http://localhost:5173"
			const params = new URLSearchParams()
			if ("success" in result) {
				params.set("activated", "true")
				params.set("message", result.message)
			} else {
				params.set("error", result.error)
			}
			res.redirect(`${baseUrl}/account/login?${params.toString()}`)
			return null
		}

		return result
	}
}