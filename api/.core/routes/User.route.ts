import type { Request, Response } from "express"
import type { $ } from "../types/routes.js"
import type { UserDeviceContext } from "../schema/AuthShapes.js"
import { CrudMethods } from "../services/CrudMethods.js"
import { User } from "../schema/DomainShapes.js"
import { UserDBRow } from "../schema/Database.js"
import multer from "multer"
import { unlink } from "node:fs/promises"
import path from "node:path"


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
		api.Router.set(["POST"], `${this.authRoute}/logout/device/:id`, this.logoutDevice, this.userOptions)

		// Vendor link management
		api.Router.set(["POST"], `${this.userRoute}/vendors`, this.listVendors, this.userOptions)
		api.Router.set(["POST"], `${this.userRoute}/vendor/:vendor/connect`, this.connectVendor, this.userOptions)
		api.Router.set(["DELETE"], `${this.userRoute}/vendor/:vendor`, this.disconnectVendor, this.userOptions)

		// Password reset & account activation
		api.Router.set(["POST"], `${this.userRoute}/reset`, this.requestReset)
		api.Router.set(["POST"], `${this.userRoute}/reset/confirm`, this.confirmReset)
		api.Router.set(["GET"], `${this.userRoute}/confirm`, this.confirmActivation)

		// Email change
		api.Router.set(["POST"], `${this.userRoute}/email/change`, this.requestEmailChange, this.userOptions)
		api.Router.set(["GET"], `${this.userRoute}/confirm-email-change`, this.confirmEmailChange)

		// User routes
		api.Router.set(["POST"], `${this.userRoute}/me`, this.me, this.userOptions)
		api.Router.set(["POST"], `${this.userRoute}/profile`, this.updateProfile, this.userOptions)
		api.Router.set(["POST"], `${this.userRoute}/settings`, this.saveSettings, this.userOptions)
		api.Router.set(["POST"], `${this.userRoute}/avatar`, this.uploadAvatar, this.userOptions)
		api.Router.set(["DELETE"], `${this.userRoute}/avatar`, this.deleteAvatar, this.userOptions)

		// Device management
		api.Router.set(["POST"], `${this.userRoute}/device`, this.updateCurrentDevice, this.userOptions)
		api.Router.set(["POST"], `${this.userRoute}/device/:id/name`, this.renameDevice, this.userOptions)
		api.Router.set(["POST"], `${this.userRoute}/device/:id/delete`, this.deleteDevice, this.userOptions)

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
		const search = req.query.search as string | undefined
		const permission = req.query.permission as string | undefined
		const p = api.Router.getParams(req, this.tableName)

		const listOptions: Record<string, any> = {
			limit: Number(p.query.limit) || 100,
			offset: Number(p.query.offset) || 0,
		}
		if (search) listOptions.search = search
		if (p.query.disabled !== undefined) listOptions.disabled = Number(p.query.disabled)
		if (p.query.activated !== undefined) listOptions.activated = Number(p.query.activated)

		let users = await api.User.Repo.list(listOptions)
		if (permission) users = users.filter((u) => u.permissions.includes(permission))
		return users
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


	// Fetches all Profile information about the current authenticated logged in user
	me = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		return await api.User.Repo.me(token ?? "")
	}

	// Update current user's profile
	updateProfile = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		const me = token ? await api.User.Repo.me(token) : null
		if (!me || "error" in me) return me ?? { error: "Unauthorized", code: 401 }

		const allowed = ["first_name", "last_name", "phone", "company", "address"]
		const data: Record<string, any> = {}
		for (const key of allowed) {
			if ($.body[key] !== undefined) data[key] = $.body[key]
		}
		// Also accept camelCase
		if ($.body.firstName !== undefined) data.first_name = $.body.firstName
		if ($.body.lastName !== undefined) data.last_name = $.body.lastName

		return await api.User.Repo.update(me.id, data)
	}
	// Save user key-value settings
	saveSettings = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		const me = token ? await api.User.Repo.me(token) : null
		if (!me || "error" in me) return me ?? { error: "Unauthorized", code: 401 }

		const settings = $.body.settings
		if (!settings || typeof settings !== "object") return { code: 422, error: "Settings object required" }

		const allowedKeys = new Set([
			"currency", "timezone", "first_day_of_week", "datetime_format",
			"notifications_app", "notifications_mail", "notification_sound",
			"dark_mode", "text_size",
			"subscribe_newsletter", "debug_mode",
		])

		const db = api.DB.connection
		let updated = 0

		for (const [key, value] of Object.entries(settings)) {
			if (!allowedKeys.has(key)) continue
			const strValue = String(value ?? "")

			const existing = await db.selectFrom("user_settings")
				.selectAll()
				.where("user_id", "=", me.id)
				.where("key", "=", key)
				.executeTakeFirst()

			if (existing) {
				await db.updateTable("user_settings")
					.set({ value: strValue })
					.where("user_id", "=", me.id)
					.where("key", "=", key)
					.execute()
			} else {
				await db.insertInto("user_settings")
					.values({ user_id: me.id, key, value: strValue } as any)
					.execute()
			}
			updated++
		}

		return { success: true, updated }
	}

	// Upload user avatar
	private readonly avatarMaxSize = 5 * 1_000_000 // 5MB
	private readonly avatarAllowedMimes = [`image/png`, `image/jpeg`, `image/avif`]

	private upload = multer({
		storage: multer.memoryStorage(),
		limits: { fileSize: this.avatarMaxSize },
		fileFilter: (_req, file, cb) => {
			if (!this.avatarAllowedMimes.includes(file.mimetype)) {
				return cb(Object.assign(new Error(`Unsupported image format. Use JPG, PNG, or AVIF`), { code: 415 }) as any)
			}
			cb(null, true)
		},
	})

	uploadAvatar = async ($: $, req: Request, res: Response) => {
		// Run multer — catch size/type errors
		try {
			await new Promise<void>((resolve, reject) => {
				this.upload.single(`avatar`)(req, res, (err: any) => err ? reject(err) : resolve())
			})
		} catch (err: any) {
			if (err?.code === `LIMIT_FILE_SIZE`) {
				const limitMB = (this.avatarMaxSize / 1_000_000).toFixed(0)
				return { code: 413, error: `File exceeds the ${limitMB}MB size limit` }
			}
			return { code: err.code && typeof err.code === `number` ? err.code : 415, error: err.message || `Upload failed` }
		}

		const file = (req as any).file as Express.Multer.File | undefined
		if (!file) return { code: 422, error: `No avatar file provided` }

		$ = api.Router.getParams(req, this.tableName)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		const me = token ? await api.User.Repo.me(token) : null
		if (!me || "error" in me) return me ?? { error: `Unauthorized`, code: 401 }

		const record = await api.FileManager.upload(file.buffer, {
			category: `avatar`,
			userId: me.id,
			mimetype: file.mimetype,
		}).catch((err: any) => ({ error: err.message || `Upload failed`, code: err.code || 500 }))

		if (`error` in record) return record

		// Clean up old avatar if path changed
		const oldUrl = me.info.avatarUrl
		if (oldUrl && oldUrl !== record.variants.original.path) {
			if (oldUrl.startsWith(`avatar/`)) {
				// New schema — delete via FileManager
				const oldFilename = oldUrl.split(`/`).pop()!
				await api.FileManager.delete(`avatar`, oldFilename)
			} else {
				// Transitional: handles legacy paths (users/avatars/profile/...)
				const uploadsDir = api.Config(`FS_UPLOAD_DIR`) || `uploads`
				await unlink(path.join(process.cwd(), uploadsDir, oldUrl)).catch(() => null)
			}
		}

		await api.DB.connection.updateTable(`users`)
			.set({ avatar_url: record.variants.original.path } as any)
			.where(`id`, `=`, me.id)
			.execute()

		return { success: true, ...record }
	}

	deleteAvatar = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req, this.tableName)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		const me = token ? await api.User.Repo.me(token) : null
		if (!me || "error" in me) return me ?? { error: `Unauthorized`, code: 401 }

		const avatarUrl = me.info.avatarUrl
		if (avatarUrl) {
			if (avatarUrl.startsWith(`avatar/`)) {
				const filename = avatarUrl.split(`/`).pop()!
				await api.FileManager.delete(`avatar`, filename)
			} else {
				// Transitional: handles legacy paths
				const uploadsDir = api.Config(`FS_UPLOAD_DIR`) || `uploads`
				await unlink(path.join(process.cwd(), uploadsDir, avatarUrl)).catch(() => null)
			}
		}

		await api.DB.connection.updateTable(`users`)
			.set({ avatar_url: null } as any)
			.where(`id`, `=`, me.id)
			.execute()

		return { success: true }
	}

	renameDevice = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		const me = token ? await api.User.Repo.me(token) : null
		if (!me || "error" in me) return me ?? { error: "Unauthorized", code: 401 }
		const deviceId = Number($.params?.id)
		if (!deviceId) return { error: "Device ID required", code: 422 }
		const customName = $.body?.custom_name ?? $.body?.customName
		if (!customName || typeof customName !== "string") return { error: "Device name required", code: 422 }
		return await api.User.Devices.renameDevice(me.id, deviceId, customName.trim())
	}

	deleteDevice = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		const me = token ? await api.User.Repo.me(token) : null
		if (!me || "error" in me) return me ?? { error: "Unauthorized", code: 401 }
		const deviceId = Number($.params?.id)
		if (!deviceId) return { error: "Device ID required", code: 422 }
		await api.User.TokenStore.revokeByDeviceId(me.id, deviceId)
		await api.User.Devices.deleteDevice(me.id, deviceId)
		return { success: true }
	}

	updateCurrentDevice = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		if (!token) return { error: "Unauthorized", code: 401 }
		const validation = await api.User.Auth.validateAccessToken(token)
		if (!validation.valid || !validation.user) return { error: validation.reason ?? "Unauthorized", code: validation.code ?? 401 }
		const deviceId = validation.deviceId
		if (!deviceId) return { error: "No device associated with this session", code: 400 }
		return await api.User.Devices.updateDevice(validation.user.id, deviceId, {
			fingerprint: $.body.fingerprint ?? undefined,
			name: $.body.device_name ?? $.body.name ?? undefined,
			userAgent: req.headers["user-agent"] as string | undefined,
			ip: req.ip,
		})
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

	logoutDevice = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = this.parseAccessToken($.headers as Record<string, any>)
		const me = token ? await api.User.Repo.me(token) : null
		if (!me || "error" in me) return me ?? { error: "Unauthorized", code: 401 }
		const deviceId = Number($.params?.id)
		if (!deviceId) return { error: "Device ID required", code: 422 }
		return await api.User.Auth.logoutDevice(me.id, deviceId)
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
		const mode = (req.query.mode as string) === "connect" ? "connect" : "login"

		if (!vendorName) {
			return { error: "Unknown vendor", code: 404 }
		}

		const vendor = api.User.Vendors.get(vendorName)
		if (!vendor || !vendor.isEnabled()) {
			return { error: "Vendor not enabled", code: 400 }
		}

		const fingerprint = (req.query.fingerprint as string) || null
		const deviceName = (req.query.device_name as string) || null

		const state = api.User.Vendors.encodeState({
			returnUrl,
			csrf: crypto.randomUUID(),
			vendor: vendorName,
			mode,
			fingerprint,
			deviceName,
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
		if (state.mode === "connect") {
			// Connect mode — store pending profile for the logged-in user to claim
			const connectToken = api.User.VendorLinks.storePending(vendorName, vendor.parseProfile(profile))
			res.redirect(buildRedirect(returnUrl, { connect_token: connectToken, vendor: vendorName }))
			return null
		}

		const authResult = await api.User.Auth.vendorLogin({
			vendor: vendorName,
			payload: profile,
			device: this.buildDevice({ fingerprint: state.fingerprint, device_name: state.deviceName }, req),
		})
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
			device: this.buildDevice($.body, req),
		})
	}

	listVendors = async ($: $, req: Request) => {
		const authUser = (req as any).authUser
		if (!authUser?.id) return { error: "Unauthorized", code: 401 }
		return { vendors: await api.User.VendorLinks.getLinked(authUser.id) }
	}

	connectVendor = async ($: $, req: Request) => {
		$ = api.Router.getParams(req)
		const authUser = (req as any).authUser
		if (!authUser?.id) return { error: "Unauthorized", code: 401 }

		const vendorName = $.params?.vendor as string
		const connectToken = $.body?.connect_token ?? $.body?.connectToken
		if (!connectToken) return { error: "Missing connect token", code: 400 }

		const pending = api.User.VendorLinks.consumePending(connectToken)
		if (!pending) return { error: "Invalid or expired connect token", code: 400 }
		if (pending.vendor !== vendorName) return { error: "Vendor mismatch", code: 400 }

		await api.User.VendorLinks.link(authUser.id, vendorName, pending.profile)
		return { success: true, message: `${vendorName} connected` }
	}

	disconnectVendor = async ($: $, req: Request) => {
		$ = api.Router.getParams(req)
		const authUser = (req as any).authUser
		if (!authUser?.id) return { error: "Unauthorized", code: 401 }

		const vendorName = $.params?.vendor as string
		const linked = await api.User.VendorLinks.getLinked(authUser.id)
		if (!linked.find(l => l.vendor === vendorName)) {
			return { error: "Vendor not connected", code: 404 }
		}

		// If last vendor link, require password to prevent lockout
		if (linked.length <= 1) {
			const password = $.body?.password
			if (!password) return { error: "Password required to disconnect last vendor", code: 400 }

			const dbRow = await api.DB.connection
				.selectFrom("users").select(["password"])
				.where("id", "=", authUser.id)
				.executeTakeFirst()
			const valid = dbRow?.password ? await api.Utils.verifyPassword(password, dbRow.password) : false
			if (!valid) return { error: "Invalid password", code: 401 }
		}

		await api.User.VendorLinks.unlink(authUser.id, vendorName)
		return { success: true, message: `${vendorName} disconnected` }
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

	requestEmailChange = async ($: $, req: Request) => {
		$ = api.Router.getParams(req)
		const authUser = (req as any).authUser
		if (!authUser?.id) return { error: "Unauthorized", code: 401 }
		return await api.User.Auth.requestEmailChange(authUser.id, $.body.email ?? $.body.newEmail ?? "")
	}

	confirmEmailChange = async ($: $, req: Request, res: Response) => {
		$ = api.Router.getParams(req)
		const token = (req.query.token as string) ?? $.body.token ?? ""
		const result = await api.User.Auth.confirmEmailChange(token)

		if (req.method === "GET") {
			const baseUrl = api.Config("WEB_URL") || "http://localhost:5173"
			const params = new URLSearchParams()
			if ("success" in result) {
				params.set("emailChanged", "true")
				params.set("message", result.message)
			} else {
				params.set("error", result.error)
			}
			res.redirect(`${baseUrl}/account/settings/email?${params.toString()}`)
			return null
		}

		return result
	}
}