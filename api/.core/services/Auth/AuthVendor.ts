import { randomUUID } from "crypto"
import type { VendorConfig, VendorProfile } from "../../schema/AuthShapes.js"

export class AuthVendor {
	constructor(private readonly config: VendorConfig) {}

	getName = () => this.config.name

	isEnabled = () => this.config.enabled

	info = () => ({
		name: this.config.name,
		enabled: this.config.enabled,
		clientId: this.config.clientId,
		redirectUri: this.config.redirectUri ?? "",
		scope: this.config.scope ?? [],
	})

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
