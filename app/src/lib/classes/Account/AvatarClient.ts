export class AvatarClient {

	/**
	 * Upload a new avatar image
	 * @param file - image file (png, jpeg, avif — max 2MB)
	 */
	async upload(file: File) {
		const result = await app.System.Request.upload<any>(
			`/account/avatar`, file, `avatar`
		)
		// Bust meCache so avatar shows in profile
		await app.Auth.me(true).catch(() => null)
		return result
	}

	/**
	 * Remove current avatar
	 */
	async remove(): Promise<{ success: boolean }> {
		const result = await app.System.Request.delete<{ success: boolean }>(`/account/avatar`)
		await app.Auth.me(true).catch(() => null)
		return result
	}

	/**
	 * Build the full avatar URL from a relative path
	 */
	url(relativePath: string | null | undefined): string | null {
		if (!relativePath) return null
		const base = app.Config.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')
		return `${base}/static/uploads/${relativePath}`
	}

	/**
	 * Resolve the best avatar src for a given pixel size from a FileRecord's variants.
	 * All variants are AVIF. Falls back to original if no matching size is found.
	 */
	resolve(avatar: any, size?: number): { src: string, srcset: string } | null {
		if (!avatar || !avatar.variants) return null

		const base = app.Config.apiBaseUrl.replace(/\/api\/v\d+\/?$/, '')
		const prefix = (url: string) => `${base}${url}`

		const pick = size ? (avatar.variants[String(size)] ?? avatar.variants.original) : avatar.variants.original
		const src = prefix(pick.url)

		const srcset = (avatar.srcset || ``)
			.split(`, `)
			.filter(Boolean)
			.map((entry: string) => {
				const [url, descriptor] = entry.split(` `)
				return `${prefix(url)} ${descriptor}`
			})
			.join(`, `)

		return { src, srcset }
	}
}
