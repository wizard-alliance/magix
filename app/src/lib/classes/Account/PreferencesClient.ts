import { get } from 'svelte/store'
import { getUserSetting, userSettingsConfig } from '../../../configs/userSettings'

export class PreferencesClient {
	get keys(): string[] {
		return userSettingsConfig.map((d) => d.key)
	}

	get(key: string): string {
		const user = get(app.State.currentUser)
		const settings = user && "settings" in user ? user.settings : undefined
		return getUserSetting(settings, key)
	}
}
