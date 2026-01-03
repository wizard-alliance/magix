const isPlainObject = (value: unknown): value is Record<string, any> => {
	return Boolean(value) && Object.prototype.toString.call(value) === '[object Object]'
}

const isEmptyValue = (value: unknown): boolean => {
	if (value === null || value === undefined) return true
	if (typeof value === 'string' && value.trim() === '') return true
	if (Array.isArray(value)) return value.length === 0
	if (isPlainObject(value)) return Object.keys(value).length === 0
	return false
}

export const toNumber = (val: unknown): number => {
	if (typeof val === `number`) return Number.isFinite(val) ? val : 0
	if (typeof val === `bigint`) {
		const num = Number(val)
		return Number.isFinite(num) ? num : 0
	}
	if (typeof val === `string`) {
		const num = Number(val.trim())
		return Number.isFinite(num) ? num : 0
	}
	return 0
}

export const maybeJSONString = (input: any): any => {
	try {
		return JSON.parse(input)
	} catch {
		return input
	}
}

export const maybeJSONDecode = (input: any): any => {
	try {
		return JSON.parse(input)
	} catch {
		return input
	}
}


export const removeKeysDeep = <T>(value: T, keys: string[] = []): T => {
	if (!value) return value
	const removeSet = new Set(keys)

	const walk = (current: any): any => {
		if (Array.isArray(current)) {
			return current.map(item => walk(item))
		}
		if (isPlainObject(current)) {
			return Object.entries(current).reduce<Record<string, any>>((acc, [key, val]) => {
				if (removeSet.has(key)) return acc
				acc[key] = walk(val)
				return acc
			}, {})
		}
		return current
	}

	return walk(value)
}

export const removeEmptyValuesDeep = <T>(value: T): T => {
	const walk = (current: any): any => {
		if (Array.isArray(current)) {
			const filtered = current
				.map(item => walk(item))
				.filter(item => !isEmptyValue(item))
			return filtered
		}
		if (isPlainObject(current)) {
			const result: Record<string, any> = {}
			for (const [key, val] of Object.entries(current)) {
				const nextVal = walk(val)
				if (isEmptyValue(nextVal)) continue
				result[key] = nextVal
			}
			return result
		}
		return current
	}

	return walk(value)
}



/**
 * Encapsulate content within specified tags.
 */
export const encapsulate = (content: string, tag: string = 'Message'): string => {
	return `<${tag}>\n${content}\n</${tag}>`.trim()
}


/**
 * Split content from specified tags.
 */
export const splitFromTags = (content: string, tag: string = 'Message'): string[] => {
	const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'g')
	const matches = []
	let match
	
	while ((match = regex.exec(content)) !== null) {
		matches.push(match[1].trim())
	}

	return matches
}

export const createSlug = (text: string): string => {
	return text
		.toString()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^\w\-]+/g, '')
		.replace(/\-\-+/g, '-')
		.replace(/^-+/, '')
		.replace(/-+$/, '')
}


export const cloneValue = <T>(input: T): T => {
	if (input === null || typeof input !== 'object') {
		return input
	}
	if (Array.isArray(input)) {
		return input.map((item) => cloneValue(item)) as unknown as T
	}
	if (input instanceof Date) {
		return new Date(input.getTime()) as unknown as T
	}
	if (input instanceof Map) {
		return new Map(Array.from(input.entries()).map(([key, value]) => [key, cloneValue(value)])) as unknown as T
	}
	if (input instanceof Set) {
		return new Set(Array.from(input.values()).map((value) => cloneValue(value))) as unknown as T
	}
	const cloned: Record<string, any> = {}
	for (const [key, value] of Object.entries(input as Record<string, any>)) {
		cloned[key] = cloneValue(value)
	}
	return cloned as T
}

export const applyWhere = (q: any, params: Record<string, any>) => {
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined) continue
		if (typeof v === "number" && !Number.isFinite(v)) continue
		if (Array.isArray(v)) {
			if (!v.length) continue
			q = q.where(k as any, "in", v as any)
			continue
		}

		if (v === null) {
			q = q.where(k as any, "is", null)
			continue
		}

		q = q.where(k as any, "=", v as any)
	}

	return q
}

export const applyOptions = (query: any, options: Record<string, any>) =>{
	if (options.limit) { query = query.limit(options.limit) }
	if (options.orderBy) { query = query.orderBy(options.orderBy) }
	if (options.offset) { query = query.offset(options.offset) }

	const applySort = (sortValue: any) => {
		if (!sortValue) return
		if (Array.isArray(sortValue)) {
			sortValue.forEach(entry => applySort(entry))
			return
		}
		if (typeof sortValue === "string") {
			query = query.orderBy(sortValue)
			return
		}
		if (typeof sortValue === "object" && typeof sortValue.column === "string") {
			const direction = typeof sortValue.order === "string" ? sortValue.order : undefined
			query = direction ? query.orderBy(sortValue.column, direction) : query.orderBy(sortValue.column)
		}
	}

	if (options.sort) {
		applySort(options.sort)
	}

	return query
}