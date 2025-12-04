export type SettingDBRow = {
	ID?: number
	version?: number
	autoload: number
	created: string
	updated: string
	key: string
	value: string | null
}

export type UserDeviceDBRow = {
	id?: number
	user_id: number
	name: string | null
	custom_name: string | null
	fingerprint: string | null
	user_agent: string | null
	ip: string | null
	last_login: string | null
	created: string | null
	updated: string | null
}

export type UserNotificationDBRow = {
	id?: number
	user_id: number
	type: string
	message: string
	read: number
	created: string | null
}

export type UserPermissionDBRow = {
	id?: number
	user_id: number
	name: string
	value: string | null
	created: string | null
	updated: string | null
}

export type UserSettingDBRow = {
	id?: number
	user_id: number
	name: string
	value: string | null
	created: string | null
	updated: string | null
}

export type UserTokenAccessDBRow = {
	id?: number
	user_id: number
	refresh_token_id: number
	token: string
	expires: string
	created: string | null
}

export type UserTokenRefreshDBRow = {
	id?: number
	user_id: number
	device_id: number | null
	token: string
	valid: number
	expires: string
	created: string | null
	updated: string | null
}

export type UserTokenBlacklistDBRow = {
	id?: number
	user_id: number
	token: string
	token_type: string | null
	reason: string | null
	expires: string
	created: string | null
	updated: string | null
}

export type UserTokenSingleDBRow = {
	id?: number
	user_id: number
	refresh_token_id: number
	token: string
	expires: string
	created: string | null
}

export type DatabaseSchema = {
	settings: SettingDBRow
	users: UserDBRow
	user_devices: UserDeviceDBRow
	user_notifications: UserNotificationDBRow
	user_permissions: UserPermissionDBRow
	user_settings: UserSettingDBRow
	user_tokens_access: UserTokenAccessDBRow
	user_tokens_blacklist: UserTokenBlacklistDBRow
	user_tokens_refresh: UserTokenRefreshDBRow
	user_tokens_single: UserTokenSingleDBRow
}


export type UserDBRow = {
	id?: number
	username: string
	email: string
	first_name: string | null
	last_name: string | null
	phone: string | null
	company: string | null
	address: string | null
	activation_token: string | null
	activated: number
	tos_accepted: number
	disabled: number
	created: string | null
	updated: string | null
	deleted_at: string | null
	password: string
	tfa_enabled: number
	tfa_secret: string | null
	activation_token_expiration: string | null
	failed_login_attempts: number
	lockout_until: string | null
}


export const schemaColumns = {
	settings: [
		"ID",
		"autoload",
		"created",
		"updated",
		"key",
		"value"
	] as const,

	users: [
		"id",
		"username",
		"email",
		"first_name",
		"last_name",
		"phone",
		"company",
		"address",
		"activation_token",
		"activated",
		"tos_accepted",
		"disabled",
		"created",
		"updated",
		"deleted_at",
		"password",
		"tfa_enabled",
		"tfa_secret",
		"activation_token_expiration",
		"failed_login_attempts",
		"lockout_until",
	] as const,

	user_devices: [
		"id",
		"user_id",
		"name",
		"custom_name",
		"fingerprint",
		"user_agent",
		"ip",
		"last_login",
		"created",
		"updated",
	] as const,

	user_notifications: [
		"id",
		"user_id",
		"type",
		"message",
		"read",
		"created",
	] as const,

	user_permissions: [
		"id",
		"user_id",
		"name",
		"value",
		"created",
		"updated",
	] as const,

	user_settings: [
		"id",
		"user_id",
		"name",
		"value",
		"created",
		"updated",
	] as const,

	user_tokens_access: [
		"id",
		"user_id",
		"refresh_token_id",
		"token",
		"expires",
		"created",
	] as const,

	user_tokens_blacklist: [
		"id",
		"user_id",
		"token",
		"token_type",
		"reason",
		"expires",
		"created",
		"updated",
	] as const,

	user_tokens_refresh: [
		"id",
		"user_id",
		"device_id",
		"token",
		"valid",
		"expires",
		"created",
		"updated",
	] as const,

	user_tokens_single: [
		"id",
		"user_id",
		"refresh_token_id",
		"token",
		"expires",
		"created",
	] as const,

} as const


export type SchemaColumns = typeof schemaColumns
type ColumnSetMap = {
	[K in keyof SchemaColumns]: ReadonlySet<SchemaColumns[K][number]>
}

export const tableColumnSets: ColumnSetMap = {
	settings: new Set<SchemaColumns["settings"][number]>(schemaColumns.settings),
	users: new Set<SchemaColumns["users"][number]>(schemaColumns.users),
	user_devices: new Set<SchemaColumns["user_devices"][number]>(schemaColumns.user_devices),
	user_notifications: new Set<SchemaColumns["user_notifications"][number]>(schemaColumns.user_notifications),
	user_permissions: new Set<SchemaColumns["user_permissions"][number]>(schemaColumns.user_permissions),
	user_settings: new Set<SchemaColumns["user_settings"][number]>(schemaColumns.user_settings),
	user_tokens_access: new Set<SchemaColumns["user_tokens_access"][number]>(schemaColumns.user_tokens_access),
	user_tokens_blacklist: new Set<SchemaColumns["user_tokens_blacklist"][number]>(schemaColumns.user_tokens_blacklist),
	user_tokens_refresh: new Set<SchemaColumns["user_tokens_refresh"][number]>(schemaColumns.user_tokens_refresh),
	user_tokens_single: new Set<SchemaColumns["user_tokens_single"][number]>(schemaColumns.user_tokens_single),
}

export type TableMap = {
	settings: string
	users: string
	user_devices: string
	user_notifications: string
	user_permissions: string
	user_settings: string
	user_tokens_access: string
	user_tokens_blacklist: string
	user_tokens_refresh: string
	user_tokens_single: string
}


export const TableMap: TableMap = {
	settings: "settings",
	users: "users",
	user_devices: "user_devices",
	user_notifications: "user_notifications",
	user_permissions: "user_permissions",
	user_settings: "user_settings",
	user_tokens_access: "user_tokens_access",
	user_tokens_blacklist: "user_tokens_blacklist",
	user_tokens_refresh: "user_tokens_refresh",
	user_tokens_single: "user_tokens_single"
}