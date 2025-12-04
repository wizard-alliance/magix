import type { RequestHandler } from "express"

export type HttpMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "PATCH"
	| "DELETE"
	| "OPTIONS"
	| "HEAD"

export type RouteDirectoryEntry = {
	method: HttpMethod
	path: string
	version?: string
}

export type RouteDefinition = RouteDirectoryEntry & {
	handlers: RequestHandler[]
	auth?: boolean
	perms?: readonly string[]
}

export interface ApiRoute {
	getName(): string
	getDefinitions(): RouteDefinition[]
	version?: string
	getVersion?(): string
}

export type $ = {
	params?: Record<string, any>
	query?: Record<string, any>
	body?: any,
	headers?: Record<string, any>
	options?: Record<string, any>
}
