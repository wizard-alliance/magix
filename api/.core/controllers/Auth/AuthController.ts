import type { Request, Response } from "express"
import type { $ } from "../../types/routes.js"

import type { VendorName, UserDeviceContext } from "../../schema/AuthShapes.js"

const parseAccessToken = (request: Request, headers?: Record<string, any>) => {
	const source = headers ?? request.headers ?? {}
	const raw = (source.authorization ?? source.Authorization ?? "") as string
	if (!raw || typeof raw !== "string") {
		return null
	}
	const [scheme, token] = raw.split(" ")
	if (scheme?.toLowerCase() !== "bearer" || !token) {
		return null
	}
	return token.trim()
}

export class AuthController {
	private readonly prefix = "AuthController"

	login = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request, { includeHeaders: true })
		const body = ($.body ?? {}) as Record<string, any>
		const result = await api.Auth.login({
			identifier: body.identifier,
			email: body.email,
			username: body.username,
			password: body.password,
			device: this.buildDevice(body, request),
		})
		api.Router.handleReturn(result, $, response, request)
	}

	register = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request, { includeHeaders: true })
		const body = ($.body ?? {}) as Record<string, any>
		const result = await api.Auth.register(
			{
				email: body.email,
				username: body.username,
				password: body.password,
				firstName: body.firstName ?? body.first_name,
				lastName: body.lastName ?? body.last_name,
				tosAccepted: Boolean(body.tosAccepted ?? body.tos_accepted ?? false),
			},
			this.buildDevice(body, request)
		)
		api.Router.handleReturn(result, $, response, request)
	}

	me = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request, { includeHeaders: true })
		const token = parseAccessToken(request, $.headers)
		const result = await api.Auth.me(token ?? "")
		api.Router.handleReturn(result, $, response, request)
	}

	refresh = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request)
		const token = ($.body?.refreshToken ?? $.body?.token ?? $.body?.refresh_token ?? "") as string
		const result = await api.Auth.refresh(token)
		api.Router.handleReturn(result, $, response, request)
	}

	logout = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request, { includeHeaders: true })
		const refreshToken = ($.body?.refreshToken ?? $.body?.token ?? $.body?.refresh_token ?? "") as string
		const accessToken = parseAccessToken(request, $.headers) ?? undefined
		const result = await api.Auth.logout(refreshToken || undefined, accessToken)
		api.Router.handleReturn(result, $, response, request)
	}

	logoutAllDevices = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request, { includeHeaders: true })
		const token = parseAccessToken(request, $.headers)
		const me = token ? await api.Auth.me(token) : null
		const userId = me && "user" in me ? me.user.id : undefined
		const result = userId ? await api.Auth.logoutAllDevices(userId) : { error: "User not resolved", code: 400 }
		api.Router.handleReturn(result, $, response, request)
	}

	logoutAllUsers = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request)
		const result = await api.Auth.logoutAllUsers()
		api.Router.handleReturn(result, $, response, request)
	}

	changePassword = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request, { includeHeaders: true })
		const token = parseAccessToken(request, $.headers)
		const me = token ? await api.Auth.me(token) : null
		if (!me || (me as any).error) {
			return api.Router.handleReturn(me ?? { error: "Unauthorized", code: 401 }, $, response, request)
		}
		const userId = (me as any).user?.id
		if (!userId) return api.Router.handleReturn({ error: "Unauthorized", code: 401 }, $, response, request)
		const body = $.body ?? {}
		const result = await api.Auth.changePassword({
			userId,
			currentPassword: body.currentPassword ?? body.current_password ?? body.current ?? "",
			newPassword: body.newPassword ?? body.new_password ?? body.password ?? "",
			logoutAll: body.logoutAll ?? body.logout_all ?? true,
		})
		api.Router.handleReturn(result, $, response, request)
	}

	updateProfile = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request, { includeHeaders: true })
		const token = parseAccessToken(request, $.headers)
		const me = token ? await api.Auth.me(token) : null
		if (!me || (me as any).error) {
			return api.Router.handleReturn(me ?? { error: "Unauthorized", code: 401 }, $, response, request)
		}
		const userId = (me as any).user?.id
		if (!userId) return api.Router.handleReturn({ error: "Unauthorized", code: 401 }, $, response, request)
		const body = $.body ?? {}
		const result = await api.Auth.updateProfile(userId, {
			first_name: body.firstName ?? body.first_name ?? null,
			last_name: body.lastName ?? body.last_name ?? null,
			phone: body.phone ?? null,
			company: body.company ?? null,
			address: body.address ?? null,
		})
		api.Router.handleReturn(result, $, response, request)
	}

	vendorInfo = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request)
		const vendor = this.normalizeVendor($.params?.vendor as string | undefined)
		const result = vendor ? api.Auth.getVendorInfo(vendor) : { error: "Unknown vendor", code: 404 }
		api.Router.handleReturn(result, $, response, request)
	}

	vendorLogin = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request)
		const vendor = this.normalizeVendor($.params?.vendor as string | undefined)
		if (!vendor) {
			return api.Router.handleReturn({ error: "Unknown vendor", code: 404 }, $, response, request)
		}
		const result = await api.Auth.vendorLogin({
			vendor,
			payload: $.body ?? {},
		})
		api.Router.handleReturn(result, $, response, request)
	}

	private normalizeVendor(value?: string | null): VendorName | null {
		const normalized = (value ?? "").toLowerCase()
		if (normalized === "discord" || normalized === "google") {
			return normalized
		}
		return null
	}

	private buildDevice(body: Record<string, any>, request: Request): UserDeviceContext {
		return {
			fingerprint: body.fingerprint ?? body.deviceId ?? null,
			userAgent: request.headers["user-agent"] as string | undefined,
			ip: request.ip,
			name: body.deviceName ?? body.device ?? null,
			customName: body.customDeviceName ?? null,
		}
	}
}
