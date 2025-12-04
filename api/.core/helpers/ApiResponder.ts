import type { Request, Response } from "express"
import type { $ } from "../types/routes.js"

export type ApiMeta = Record<string, unknown>

export type ApiResponse<T> = {
	status: "success" | "error"
	code: number
	data: T | null
	error: string | null
	path: string
	timestamp: string
	meta: ApiMeta | null
	$: $ | null
}

const sanitizeValue = (value: any): any => {
	if (typeof value === "bigint") {
		const asNumber = Number(value)
		return Number.isSafeInteger(asNumber) ? asNumber : value.toString()
	}
	if (Array.isArray(value)) {
		return value.map(sanitizeValue)
	}
	if (Buffer.isBuffer(value)) {
		return value
	}
	if (value instanceof Date) {
		return value
	}
	if (value instanceof Map) {
		return Object.fromEntries(Array.from(value.entries()).map(([k, v]) => [k, sanitizeValue(v)]))
	}
	if (value instanceof Set) {
		return Array.from(value).map(sanitizeValue)
	}
	if (value && typeof value === "object") {
		if (typeof (value as any).toJSON === "function") {
			return sanitizeValue((value as any).toJSON())
		}
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [key, sanitizeValue(entryValue)])
		)
	}
	return value
}

const buildPayload = <T>(
	status: "success" | "error",
	code: number,
	data: T | null,
	error: string | null,
	path: string,
	meta?: ApiMeta | null,
	context?: $
): ApiResponse<T> => ({
	status,
	code,
	data,
	error,
	path,
	timestamp: new Date().toISOString(),
	meta: meta ?? null,
	$: context ?? null,
})

const detectPath = (response: Response, request?: Request) => {
	if (request?.originalUrl) return request.originalUrl
	if ((response as any).req?.originalUrl)
		return (response as any).req.originalUrl as string
	return ""
}

export const sendSuccess = <T>(
	response: Response,
	options: { data: T; $?: $; code?: number; request?: Request; meta?: ApiMeta }
) => {
	const { data, code = 200, request, meta, $ } = options
	const payload = buildPayload(
		"success",
		code,
		data,
		null,
		detectPath(response, request),
		meta,
		$
	)
	// response.setHeader("Cache-Control", "no-store")
	// response.setHeader("Pragma", "no-cache")
	const responsePayload = sanitizeValue(payload) as ApiResponse<T>
	response.status(code).json(responsePayload)
}

export const sendError = (
	response: Response,
	options: {
		error: string
		code?: number
		$?: $
		request?: Request
		data?: unknown
		meta?: ApiMeta
	}
) => {
	const { error, code = 400, request, data = null, meta, $ } = options
	const payload = buildPayload(
		"error",
		code,
		(data ?? null) as unknown,
		error,
		detectPath(response, request),
		meta,
		$
	)
	// response.setHeader("Cache-Control", "no-store")
	// response.setHeader("Pragma", "no-cache")
	const responsePayload = sanitizeValue(payload) as ApiResponse<unknown>
	response.status(code).json(responsePayload)
}
