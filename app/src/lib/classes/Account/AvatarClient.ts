export class AvatarClient {

	/**
	 * Upload a new avatar image
	 * @param file - image file (png, jpeg, webp — max 2MB)
	 */
	async upload(file: File): Promise<{ success: boolean, avatarUrl: string }> {
		const result = await app.System.Request.upload<{ success: boolean, avatarUrl: string }>(
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
}
