import type { Request, Response } from "express"

export type $ = {
	params?: Record<string, any>
	query?: Record<string, any>
	body?: any,
	headers?: Record<string, any>
	options?: Record<string, any>
	all?: Record<string, any>
}

export type HttpMethod = | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD"

export type RouteCallback = ($: $, req: Request, res: Response) => any | Promise<any>

export type RouteOptions = {
	protected?: boolean
	register?: boolean
	index?: boolean
	tableName?: string
	perms?: string[]
	[key: string]: any
}

export type RouteMeta = {
	isRegistered: boolean
	isProtected: boolean
	isIndex: boolean
	perms: string[]
	createdAt: number
	updatedAt: number | null
	tableName: string | null
	[key: string]: any
}

export type Route = {
	method: HttpMethod
	path: string
	name: string
	callback: RouteCallback
	meta: RouteMeta
	params?: Record<string, any>
}

export type RestParams = {
	isEmpty: boolean
	body: Record<string, any>
	query: Record<string, any>
	params: Record<string, any>
	headers?: Record<string, any>
}

export type ApiResponse = {
	code: number
	status: string
	data: any | null
	error: boolean
	errorMessage: string | null
	path: string
	timestamp: string
	meta: Record<string, unknown> | null
	$: $ | null
}
