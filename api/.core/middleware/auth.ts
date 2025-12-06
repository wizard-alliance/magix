import type { Request, Response, NextFunction, RequestHandler } from "express"

const parseBearer = (request: Request) => {
	const raw = request.headers.authorization || request.headers.Authorization
	if (!raw || typeof raw !== "string") return null
	const [scheme, token] = raw.split(" ")
	if (!scheme || scheme.toLowerCase() !== "bearer" || !token) return null
	return token.trim()
}

type GuardOptions = {
	perms?: readonly string[]
	optional?: boolean
}

export const requireAuth = (options: GuardOptions = {}): RequestHandler => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const token = parseBearer(req)
		if (!token) {
			if (options.optional) return next()
			return api.Utils.sendError(res, { error: "Unauthorized", code: 401, request: req })
		}

		const validation = await api.Auth.validateAccessToken(token)
		if (!validation.valid || !validation.user) {
			return api.Utils.sendError(res, { error: validation.reason ?? "Unauthorized", code: validation.code ?? 401, request: req })
		}

		if (options.perms && options.perms.length) {
			const has = await api.Auth.hasPermissions(validation.user.id!, options.perms)
			if (!has) {
				return api.Utils.sendError(res, { error: "Forbidden", code: 403, request: req })
			}
		}

		(req as any).authUser = validation.user
		next()
	}
}
