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
