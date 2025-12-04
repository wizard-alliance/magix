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
