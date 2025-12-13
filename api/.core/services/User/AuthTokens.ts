import { createHmac, timingSafeEqual } from "crypto"
import { Config } from "../../config/env.js"
import type { TokenPayload, SignedToken, TokenType, TokenVerification } from "../../schema/AuthShapes.js"

const base64url = (input: Buffer | string) => {
	const buffer = typeof input === "string" ? Buffer.from(input, "utf8") : input
	return buffer.toString("base64url")
}

const parseDuration = (value: string | number): number => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return Math.max(1, Math.floor(value))
	}
	if (typeof value !== "string" || !value.trim().length) {
		return 900
	}
	const normalized = value.trim().toLowerCase()
	const match = normalized.match(/^(\d+)([smhd])?$/)
	if (!match) {
		const fallback = Number(normalized)
		return Number.isFinite(fallback) ? Math.max(1, Math.floor(fallback)) : 900
	}
	const amount = Number(match[1])
	const unit = match[2] ?? "s"
	const unitMap: Record<string, number> = {
		s: 1,
		m: 60,
		h: 3600,
		d: 86400,
	}
	const multiplier = unitMap[unit] ?? 1
	return Math.max(1, Math.floor(amount * multiplier))
}

export class AuthTokenManager {
	private readonly secret = Config("JWT_SECRET")
	private readonly issuer = Config("JWT_ISS")
	private readonly accessAud = Config("JWT_ACCESS_AUD")
	private readonly accessTtl = Config("JWT_ACCESS_TTL")
	private readonly refreshTtl = Config("JWT_REFRESH_TTL")
	private readonly prefix = "AuthTokenManager"

	signAccess = (payload: Omit<TokenPayload, "type">): SignedToken =>
		this.sign({ ...payload, type: "access", aud: this.accessAud }, this.accessTtl)

	signRefresh = (payload: Omit<TokenPayload, "type">): SignedToken =>
		this.sign({ ...payload, type: "refresh", aud: "refresh" }, this.refreshTtl)

	sign = (payload: TokenPayload, ttl: string | number): SignedToken => {
		const header = { alg: "HS256", typ: "JWT" }
		const issuedAt = Math.floor(Date.now() / 1000)
		const expiresIn = parseDuration(ttl)
		const exp = issuedAt + expiresIn

		const tokenPayload: TokenPayload = {
			...payload,
			iss: payload.iss ?? this.issuer,
			iat: issuedAt,
			exp,
		}

		const encodedHeader = base64url(JSON.stringify(header))
		const encodedPayload = base64url(JSON.stringify(tokenPayload))
		const signingInput = `${encodedHeader}.${encodedPayload}`
		const signature = createHmac("sha256", this.secret).update(signingInput).digest()
		const encodedSignature = base64url(signature)
		const token = `${signingInput}.${encodedSignature}`

		return {
			token,
			expiresAt: new Date(exp * 1000),
		}
	}

	verify = (token: string, expectedType?: TokenType): TokenVerification => {
		try {
			const [encodedHeader, encodedPayload, signature] = token.split(".")
			if (!encodedHeader || !encodedPayload || !signature) {
				return { valid: false, reason: "Malformed token" }
			}

			const signingInput = `${encodedHeader}.${encodedPayload}`
			const expected = createHmac("sha256", this.secret).update(signingInput).digest()
			const provided = Buffer.from(signature, "base64url")
			if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
				return { valid: false, reason: "Signature mismatch" }
			}

			const rawPayload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"))
			const payload: TokenPayload = rawPayload
			if (expectedType && payload.type !== expectedType) {
				return { valid: false, reason: `Expected ${expectedType} token` }
			}
			const now = Date.now()
			const leewayMs = 24 * 60 * 60_000
			if (payload.exp && now >= payload.exp * 1000 + leewayMs) {
				return { valid: false, reason: "Token expired" }
			}
			return { valid: true, payload }
		} catch (error) {
			api.Log(
				`Token verification failed: ${(error as Error).message}`,
				this.prefix,
				"warning"
			)
			return { valid: false, reason: "Invalid token" }
		}
	}
}
