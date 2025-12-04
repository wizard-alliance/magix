export type QueryOptionsPayload = {
	limit?: number
	offset?: number
	page?: number
}

export type QueryOptionsInput =
	| Partial<Record<keyof QueryOptionsPayload, unknown>>
	| null
	| undefined

const coerceNumber = (value: unknown) => {
	if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
		return undefined
	}
	return value
}

export const normalizeQueryOptions = (options?: QueryOptionsInput): QueryOptionsPayload => {
	const payload: QueryOptionsPayload = {}
	if (!options) {
		return payload
	}

	const limit = coerceNumber(options.limit)
	if (typeof limit === "number") {
		payload.limit = Math.max(0, Math.floor(limit))
	}

	const offset = coerceNumber(options.offset)
	if (typeof offset === "number") {
		payload.offset = Math.max(0, Math.floor(offset))
	}

	const page = coerceNumber(options.page)
	if (typeof page === "number") {
		payload.page = Math.max(1, Math.floor(page))
	}

	return payload
}
