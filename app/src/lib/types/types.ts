

/**
 * TYPES: SETTINGS
 */
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

export type SettingsMap = Record<string, string>

export type SettingsResponse = {
	settings: Array<{
		key: string
		value: string
		autoload: boolean
		created_at: string
		updated_at: string
	}>
	count: number
}


/**
 * TYPES: AUTH
 */
export type AuthTokens = {
	access: {
		token: string
		expiresAt: string
	}
	refresh: {
		token: string
		expiresAt: string
	}
}

export type UserDBRow = {
	id: number
	email: string
	username: string
	firstName: string | null
	lastName: string | null
	phone?: string | null
	company?: string | null
	address?: string | null
	avatarUrl?: string | null
	avatar?: any | null
	activated: boolean
	disabled: boolean
	created: string | null
	updated: string | null
}

export type UserFull = {
	id: number
	info: UserDBRow
	permissions: string[]
	settings: { key: string; value: string | null }[]
	devices: any[]
}

export type AuthPayload = {
	user: UserDBRow
	tokens: AuthTokens
}


/**
 * TYPES: API
 */
export type ApiResponse<T> = {
	status: 'success' | 'error'
	code: number
	data: T | null
	error: string | null
	path: string
	timestamp: string
	meta: Record<string, unknown> | null
}

export type HttpMethod = 'get' | 'post' | 'put' | 'delete'

export type RequestPayload = Record<string, any>

export type RequestOptions = {
	query?: RequestPayload
	body?: RequestPayload
	useAuth?: boolean
	headers?: Record<string, string>
	allowRefresh?: boolean
}


/**
 * TYPES: Logging
 */
export type LoggerType = 'generic' | 'success' | 'warning' | 'error'
export type LogLevel = "default" | "warning" | "error" | "success"

export type AppLogEntry = {
	timestamp: string
	prefix: string
	type: LoggerType
	content: string
	line: string
}


// // // // // // // 
// ADDITIONAL TYPES
// // // // // // // 

export type Timestamp = string | Date | null

export type HealthResponse = {
	status: string
	timestamp: string
	apiBaseUrl: string
	databaseConfigured: boolean
	databaseVersion: string | null
	smtpConfigured: boolean
}

export type NavigationLink = {
	label: string
	href: string
}


/**
 * TYPES: App State
 */
import type { Writable } from 'svelte/store'
import type { ComponentType, SvelteComponent } from 'svelte'

type DragPayload = DragEvent | PointerEvent | MouseEvent | Record<string, unknown> | null | undefined
type ClickPayload = MouseEvent | PointerEvent | Record<string, unknown> | null | undefined
type SidebarContent = { component: ComponentType<SvelteComponent>, props?: Record<string, any> } | null

export type UIStateStores = {
	isDragging: Writable<boolean>
	dragData: Writable<DragPayload | null>
	isClicking: Writable<boolean>
	clickData: Writable<ClickPayload | null>
	sidebar1: Writable<SidebarContent>
	sidebar2: Writable<SidebarContent>
	sidebar0Visible: Writable<boolean>
	sidebar1Visible: Writable<boolean>
	sidebar2Visible: Writable<boolean>
	notificationsOpen: Writable<boolean>
	menuOpen: Writable<boolean>
}

export type AppState = {
	currentUser: Writable<UserDBRow | UserFull | null>
	UI: UIStateStores
}