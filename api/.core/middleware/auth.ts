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
		const $ = api.Router.getParams(req)
		
		if (!token) {
			if (options.optional) return next()
			return api.Router.error({ error: "Unauthorized: No token provided", code: 401 }, res, req, $)
		}

		const validation = await api.User.Auth.validateAccessToken(token)
		if (!validation.valid || !validation.user) {
			return api.Router.error({ error: "Unauthorized: Invalid token - " + validation.reason, code: 401 }, res, req, $)
		}

		if (options.perms && options.perms.length) {
			const has = await api.User.Auth.permissions.has(validation.user.id!, options.perms)
			if (!has) {
				return api.Router.error({ error: "Forbidden: Insufficient permissions", code: 403 }, res, req, $)
			}
		}

		(req as any).authUser = validation.user
		next()
	}
}
