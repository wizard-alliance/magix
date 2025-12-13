
import type { UserDBRow } from "./Database.js"
import { User } from "./DomainShapes.js"

/**
 * TYPES: VENDOR AUTH
 */
export type VendorProfile = {
	id: string
	email: string
	username: string
	displayName: string
}

export type VendorConfig = {
	name: string
	enabled: boolean
	clientId: string
	clientSecret?: string
	redirectUri?: string
	scope?: string[]
}


export type UserDeviceContext = {
	fingerprint?: string
	userAgent?: string
	ip?: string
	name?: string
	customName?: string
}

export type AuthPayload = {
	user: User
	tokens: SessionTokens
}

export type VendorLoginInput = {
	vendor: string
	payload: Record<string, any>
}

export type RegisterInput = {
	email?: string
	username?: string
	password?: string
	firstName?: string
	lastName?: string
	tosAccepted?: boolean
}

export type LoginInput = {
	identifier?: string
	email?: string
	username?: string
	password?: string
	device?: UserDeviceContext
}

export type ChangePasswordInput = {
	userId: number
	currentPassword?: string
	newPassword?: string
	logoutAll?: boolean
}


/**
 * TYPES: AUTH TOKENS
 */
export type TokenType = "access" | "refresh" | "single"


export type SessionTokens = {
	access: {
		token: string
		expiresAt: Date
	}
	refresh: {
		token: string
		expiresAt: Date
	}
}

export type TokenPayload = {
	sub: number
	type: TokenType
	aud?: string
	iss?: string
	exp?: number
	iat?: number
	vendor?: string
	deviceId?: number | null
}

export type SignedToken = {
	token: string
	expiresAt: Date
}

export type TokenVerification = {
	valid: boolean
	reason?: string
	payload?: TokenPayload
}