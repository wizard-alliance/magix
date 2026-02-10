export type UserSettingType = "toggle" | "select" | "range"

export type UserSettingCategory = "regional" | "notifications" | "appearance" | "advanced"

export type UserSettingOption = { label: string; value: string }

export type UserSettingDef = {
	key: string
	label: string
	description: string
	type: UserSettingType
	category: UserSettingCategory
	defaultValue: string
	options?: UserSettingOption[]
	min?: number
	max?: number
	step?: number
}

export const categoryLabels: Record<UserSettingCategory, { title: string; description: string; icon: string }> = {
	regional: { title: "Regional", description: "Language, timezone, and formatting preferences", icon: "fa-light fa-globe" },
	notifications: { title: "Notifications", description: "How and when you receive notifications", icon: "fa-light fa-bell" },
	appearance: { title: "Appearance", description: "Customize the look and feel", icon: "fa-light fa-palette" },
	advanced: { title: "Advanced", description: "Developer and advanced options", icon: "fa-light fa-flask" },
}

const currencyOptions: UserSettingOption[] = [
	{ label: "NOK", value: "NOK" },
	{ label: "USD", value: "USD" },
	{ label: "EUR", value: "EUR" },
	{ label: "GBP", value: "GBP" },
]

const dayOfWeekOptions: UserSettingOption[] = [
	{ label: "Monday", value: "monday" },
	{ label: "Sunday", value: "sunday" },
	{ label: "Saturday", value: "saturday" },
]

const datetimeFormatOptions: UserSettingOption[] = [
	{ label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
	{ label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
	{ label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
]

const textSizeOptions: UserSettingOption[] = [
	{ label: "90%", value: "90" },
	{ label: "100%", value: "100" },
	{ label: "125%", value: "125" },
	{ label: "150%", value: "150" },
]

const timezoneOptions: UserSettingOption[] = (() => {
	try {
		return Intl.supportedValuesOf("timeZone").map((tz) => ({ label: tz.replace(/_/g, " "), value: tz }))
	} catch {
		return [
			{ label: "UTC", value: "UTC" },
			{ label: "Europe/Oslo", value: "Europe/Oslo" },
			{ label: "America/New York", value: "America/New_York" },
			{ label: "America/Los Angeles", value: "America/Los_Angeles" },
			{ label: "Europe/London", value: "Europe/London" },
			{ label: "Europe/Berlin", value: "Europe/Berlin" },
			{ label: "Asia/Tokyo", value: "Asia/Tokyo" },
		]
	}
})()

export const userSettingsConfig: UserSettingDef[] = [
	// Regional
	{ key: "currency", label: "Currency", description: "Preferred display currency", type: "select", category: "regional", defaultValue: "USD", options: currencyOptions },
	{ key: "timezone", label: "Timezone", description: "Your local timezone", type: "select", category: "regional", defaultValue: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return "UTC" } })(), options: timezoneOptions },
	{ key: "first_day_of_week", label: "First day of week", description: "Start of the calendar week", type: "select", category: "regional", defaultValue: "monday", options: dayOfWeekOptions },
	{ key: "datetime_format", label: "Date format", description: "How dates are displayed", type: "select", category: "regional", defaultValue: "YYYY-MM-DD", options: datetimeFormatOptions },

	// Notifications
	{ key: "notifications_app", label: "In-app notifications", description: "Show notifications inside the app", type: "toggle", category: "notifications", defaultValue: "1" },
	{ key: "notifications_mail", label: "Email notifications", description: "Receive notifications via email", type: "toggle", category: "notifications", defaultValue: "1" },
	{ key: "notification_sound", label: "Notification sound", description: "Play a sound for new notifications", type: "toggle", category: "notifications", defaultValue: "1" },

	// Appearance
	{ key: "dark_mode", label: "Dark mode", description: "Use dark color scheme", type: "toggle", category: "appearance", defaultValue: "1" },
	{ key: "text_size", label: "Text size", description: "Base font size for the interface", type: "select", category: "appearance", defaultValue: "100", options: textSizeOptions },
	{ key: "ui_sfx_enabled", label: "UI sound effects", description: "Play sound effects for UI interactions", type: "toggle", category: "appearance", defaultValue: "1" },
	{ key: "ui_sfx_volume", label: "SFX volume", description: "Volume level for UI sound effects", type: "range", category: "appearance", defaultValue: "80", min: 0, max: 100, step: 10 },

	// Advanced
	{ key: "subscribe_newsletter", label: "Newsletter", description: "Receive product updates via email", type: "toggle", category: "advanced", defaultValue: "0" },
	{ key: "debug_mode", label: "Debug mode", description: "Show developer information and logs", type: "toggle", category: "advanced", defaultValue: "0" },
]

export const getUserSetting = (settings: { key: string; value: string | null }[] | undefined, key: string): string => {
	const found = settings?.find((s) => s.key === key)
	if (found?.value != null) return found.value
	const def = userSettingsConfig.find((d) => d.key === key)
	return def?.defaultValue ?? ""
}

export const getSettingsByCategory = (category: UserSettingCategory) =>
	userSettingsConfig.filter((s) => s.category === category)
