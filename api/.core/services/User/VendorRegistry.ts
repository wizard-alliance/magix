import { AuthVendor } from "./AuthVendor.js"

type OAuthState = {
	returnUrl: string
	csrf: string
	vendor: string
}

export class VendorRegistry {
	private readonly vendors: Record<string, AuthVendor>

	constructor() {
		this.vendors = {
			discord: new AuthVendor({
				name: "discord",
				enabled: api.Config("DISCORD_CLIENT_ENABLED") ? true : false,
				clientId: api.Config("DISCORD_CLIENT_ID") ?? "",
				clientSecret: api.Config("DISCORD_CLIENT_SECRET") ?? "",
				redirectUri: api.Config("DISCORD_REDIRECT_URI") ?? "",
				scope: ["identify", "email"],
			}),
			google: new AuthVendor({
				name: "google",
				enabled: api.Config("GOOGLE_CLIENT_ENABLED") ? true : false,
				clientId: api.Config("GOOGLE_CLIENT_ID") ?? "",
				clientSecret: api.Config("GOOGLE_CLIENT_SECRET") ?? "",
				redirectUri: api.Config("GOOGLE_REDIRECT_URI") ?? "",
				scope: ["profile", "email"],
			}),
		}
	}

	get = (vendor: string) => this.vendors[vendor]

	getInfo = (vendor: string) => {
		const resolved = this.get(vendor)
		if (!resolved) {
			return { error: "Unknown vendor", code: 404 }
		}
		return { vendor: resolved.info() }
	}

	/** Encode state for OAuth redirect */
	encodeState = (data: OAuthState): string => {
		return Buffer.from(JSON.stringify(data)).toString("base64url")
	}

	/** Decode state from OAuth callback */
	decodeState = (state: string): OAuthState | null => {
		try {
			return JSON.parse(Buffer.from(state, "base64url").toString("utf8"))
		} catch {
			return null
		}
	}
}
