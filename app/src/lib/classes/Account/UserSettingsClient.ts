export class UserSettingsClient {

	/**
	 * Save user preferences (bulk upsert)
	 * @param settings - key/value map of settings to save
	 */
	async save(settings: Record<string, string>): Promise<{ success: boolean, updated: number }> {
		const result = await app.Request.post<{ success: boolean, updated: number }>(`/account/settings`, {
			body: { settings },
		})
		// Bust meCache so next me() call returns fresh settings
		await app.Auth.me(true).catch(() => null)
		return result
	}
}
