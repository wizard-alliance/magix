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


export type ColumnType = 'string' | 'number' | 'date'


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
	settings: {
		ID: 'number',
		autoload: 'number',
		created: 'date',
		updated: 'date',
		key: 'string',
		value: 'string'
	},

	users: {
		id: 'number',
		username: 'string',
		email: 'string',
		first_name: 'string',
		last_name: 'string',
		phone: 'string',
		company: 'string',
		address: 'string',
		activation_token: 'string',
		activated: 'number',
		tos_accepted: 'number',
		disabled: 'number',
		created: 'date',
		updated: 'date',
		deleted_at: 'date',
		password: 'string',
		tfa_enabled: 'number',
		tfa_secret: 'string',
		activation_token_expiration: 'date',
		failed_login_attempts: 'number',
		lockout_until: 'date'
	},

	user_devices: {
		id: 'number',
		user_id: 'number',
		name: 'string',
		custom_name: 'string',
		fingerprint: 'string',
		user_agent: 'string',
		ip: 'string',
		last_login: 'date',
		created: 'date',
		updated: 'date'
	},

	user_notifications: {
		id: 'number',
		user_id: 'number',
		type: 'string',
		message: 'string',
		read: 'number',
		created: 'date'
	},

	user_permissions: {
		id: 'number',
		user_id: 'number',
		name: 'string',
		value: 'string',
		created: 'date',
		updated: 'date'
	},

	user_settings: {
		id: 'number',
		user_id: 'number',
		name: 'string',
		value: 'string',
		created: 'date',
		updated: 'date'
	},

	user_tokens_access: {
		id: 'number',
		user_id: 'number',
		refresh_token_id: 'number',
		token: 'string',
		expires: 'date',
		created: 'date'
	},

	user_tokens_blacklist: {
		id: 'number',
		user_id: 'number',
		token: 'string',
		token_type: 'string',
		reason: 'string',
		expires: 'date',
		created: 'date',
		updated: 'date'
	},

	user_tokens_refresh: {
		id: 'number',
		user_id: 'number',
		device_id: 'number',
		token: 'string',
		valid: 'number',
		expires: 'date',
		created: 'date',
		updated: 'date'
	},

	user_tokens_single: {
		id: 'number',
		user_id: 'number',
		refresh_token_id: 'number',
		token: 'string',
		expires: 'date',
		created: 'date'
	},

} as const satisfies Record<string, Record<string, ColumnType>>


export type SchemaColumns = typeof schemaColumns
type ColumnSetMap = {
	[K in keyof SchemaColumns]: ReadonlySet<keyof SchemaColumns[K]>
}

const createColumnSet = <T extends Record<string, ColumnType>>(columns: T) => {
	return new Set(Object.keys(columns)) as ReadonlySet<keyof T>
}

export const tableColumnSets: ColumnSetMap = {
	settings: createColumnSet(schemaColumns.settings),
	users: createColumnSet(schemaColumns.users),
	user_devices: createColumnSet(schemaColumns.user_devices),
	user_notifications: createColumnSet(schemaColumns.user_notifications),
	user_permissions: createColumnSet(schemaColumns.user_permissions),
	user_settings: createColumnSet(schemaColumns.user_settings),
	user_tokens_access: createColumnSet(schemaColumns.user_tokens_access),
	user_tokens_blacklist: createColumnSet(schemaColumns.user_tokens_blacklist),
	user_tokens_refresh: createColumnSet(schemaColumns.user_tokens_refresh),
	user_tokens_single: createColumnSet(schemaColumns.user_tokens_single),
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