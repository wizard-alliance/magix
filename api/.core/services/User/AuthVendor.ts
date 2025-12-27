import { randomUUID } from "crypto"
import type { VendorConfig, VendorProfile } from "../../schema/AuthShapes.js"

type OAuthEndpoints = {
	authorize: string
	token: string
	userInfo: string
}

const OAUTH_ENDPOINTS: Record<string, OAuthEndpoints> = {
	discord: {
		authorize: "https://discord.com/api/oauth2/authorize",
		token: "https://discord.com/api/oauth2/token",
		userInfo: "https://discord.com/api/users/@me",
	},
	google: {
		authorize: "https://accounts.google.com/o/oauth2/v2/auth",
		token: "https://oauth2.googleapis.com/token",
		userInfo: "https://www.googleapis.com/oauth2/v2/userinfo",
	},
}

export class AuthVendor {
	private readonly endpoints: OAuthEndpoints

	constructor(private readonly config: VendorConfig) {
		this.endpoints = OAUTH_ENDPOINTS[config.name] ?? OAUTH_ENDPOINTS.discord
	}

	getName = () => this.config.name

	isEnabled = () => this.config.enabled

	info = () => ({
		name: this.config.name,
		enabled: this.config.enabled,
		clientId: this.config.clientId,
		redirectUri: this.config.redirectUri ?? "",
		scope: this.config.scope ?? [],
	})

	/** Build the OAuth authorize URL (redirects user to provider) */
	buildAuthorizeUrl = (state: string) => {
		const params = new URLSearchParams({
			client_id: this.config.clientId,
			redirect_uri: this.config.redirectUri ?? "",
			response_type: "code",
			scope: (this.config.scope ?? []).join(" "),
			state,
		})
		return `${this.endpoints.authorize}?${params.toString()}`
	}

	/** Exchange authorization code for access token */
	exchangeCode = async (code: string): Promise<{ access_token?: string; error?: string }> => {
		try {
			const res = await fetch(this.endpoints.token, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					client_id: this.config.clientId,
					client_secret: this.config.clientSecret ?? "",
					grant_type: "authorization_code",
					code,
					redirect_uri: this.config.redirectUri ?? "",
				}),
			})
			const data = await res.json()
			if (!res.ok || data.error) {
				return { error: data.error_description ?? data.error ?? "Token exchange failed" }
			}
			return { access_token: data.access_token }
		} catch (err) {
			return { error: "Token exchange request failed" }
		}
	}

	/** Fetch user profile from provider using access token */
	fetchProfile = async (accessToken: string): Promise<Record<string, any> | null> => {
		try {
			const res = await fetch(this.endpoints.userInfo, {
				headers: { Authorization: `Bearer ${accessToken}` },
			})
			if (!res.ok) return null
			return await res.json()
		} catch {
			return null
		}
	}

	buildRedirectUrl = (state?: string) => {
		if (!this.config.redirectUri) {
			return ""
		}
		if (!state) {
			return this.config.redirectUri
		}
		const separator = this.config.redirectUri.includes("?") ? "&" : "?"
		return `${this.config.redirectUri}${separator}state=${encodeURIComponent(state)}`
	}

	parseProfile = (payload: Record<string, any>): VendorProfile => {
		const rawId =
			payload?.id ??
			payload?.code ??
			payload?.token ??
			payload?.vendorId ??
			randomUUID()

		const normalizedId = `${rawId}`
		const normalizedName = `${payload?.username ?? payload?.displayName ?? payload?.name ?? this.config.name}_${normalizedId}`.replace(
			/[^a-z0-9_]+/gi,
			"_"
		)

		const email =
			typeof payload?.email === "string" && payload.email.includes("@")
				? payload.email
				: `${normalizedId}@${this.config.name}.local`

		return {
			id: normalizedId,
			email,
			username: normalizedName.toLowerCase(),
			displayName: payload?.displayName ?? payload?.username ?? this.config.name,
		}
	}
}
