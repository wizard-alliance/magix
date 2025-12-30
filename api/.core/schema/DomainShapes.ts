export type Settings = {
	ID?: number
	version?: number
	autoload: number
	key: string
	value: string
	dates: {
		created: string | null
		updated: string | null
	}
}


export type User = {
	id: number
	email: string
	username: string
	firstName: string | null
	lastName: string | null
	phone?: string | null
	company?: string | null
	address?: string | null
	password?: string
	activated: boolean
	disabled: boolean
	created: string | null
	updated: string | null
	tosAccepted?: boolean
}

export type UserDeviceSession = {
	id: number
	valid: boolean
	expires: string | null
	created: string | null
}

export type UserDevice = {
	id: number
	name: string | null
	customName: string | null
	fingerprint: string | null
	userAgent: string | null
	ip: string | null
	lastLogin: string | null
	created: string | null
	sessions: UserDeviceSession[]
}

export type UserSetting = {
	key: string
	value: string | null
}

export type UserFull = {
	id: number
	info: User
	permissions: string[]
	devices: UserDevice[]
	settings: UserSetting[]
}
