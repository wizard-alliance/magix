export function convertRecursiveObjToStr(
	obj: any,
	valueType: 'number' | 'percentage' | 'boolean' | 'bool' | 'raw',
	prefix?: string,
	suffix?: string,
	maxDepth = 4,
	defaultItemName = 'item',
	parentKey?: string,
	level = 0,
): string {
	if (obj == null) {
		return ''
	}

	if (typeof obj !== 'object') {
		const bullet = prefix && prefix.length ? prefix : '- '
		return `${bullet}${formatValue(obj, valueType)}${suffix || ''}`.trim()
	}

	if (level >= maxDepth) {
		return flattenObject(obj, valueType, prefix, suffix)
	}

	if (Array.isArray(obj)) {
		return renderArraySection(obj, valueType, prefix, suffix, maxDepth, defaultItemName, parentKey, level)
	}

	const primitiveEntries: Record<string, any> = {}
	const nestedEntries: { key: string; value: any }[] = []

	for (const [key, value] of Object.entries(obj)) {
		if (value && typeof value === 'object' && !(value instanceof Date)) {
			nestedEntries.push({ key, value })
		} else {
			primitiveEntries[key] = value
		}
	}

	const sections: string[] = []
	if (Object.keys(primitiveEntries).length > 0) {
		sections.push(convertObjToStr(primitiveEntries, valueType, prefix, suffix))
	}

	for (const { key, value } of nestedEntries) {
		const isArray = Array.isArray(value)
		const nextLevel = level + 1
		const child = isArray
			? renderArraySection(value, valueType, prefix, suffix, maxDepth, defaultItemName, key, nextLevel)
			: convertRecursiveObjToStr(value, valueType, prefix, suffix, maxDepth, defaultItemName, key, nextLevel)
		if (!child) {
			continue
		}
		if (!isArray && nextLevel >= maxDepth) {
			if (sections.length) {
				const lastIndex = sections.length - 1
				sections[lastIndex] = `${sections[lastIndex]}\n${child}`.trim()
			} else {
				sections.push(child)
			}
			continue
		}
		const headingLabel = `# ${formatKeyLabel(key)}${isArray ? '' : ':'}`
		sections.push(`${headingLabel}\n${child}`)
	}

	return sections.join('\n\n').trim()
}

/**
 * Takes a object and converts it to a string with struct: Key = "value"
 */
export function convertObjToStr(obj: any, valueType: 'number' | 'percentage' | 'boolean' | 'bool' | 'raw', prefix?: string, suffix?: string): string {
	if (typeof obj === 'string') {
		return obj
	}
	
	let result = ''
	for (const [key, value] of Object.entries(obj)) {
		const valueStr = formatValue(value, valueType, key)
		const keyPretty = formatKeyLabel(key)

		result += `${prefix || '- '}${keyPretty}: ${valueStr}${suffix || ''}\n`
	}
	return result.trim()
}

function formatValue(value: any, valueType: 'number' | 'percentage' | 'boolean' | 'bool' | 'raw', key?: string) {
	let formatted = ''
	if (valueType === 'number') {
		formatted = Number(value).toString()
	} else if (valueType === 'percentage') {
		formatted = `${Number(value)}%`
	} else if (valueType === 'boolean' || valueType === 'bool') {
		formatted = value ? 'true' : 'false'
	} else {
		formatted = String(value)
	}

	if (typeof value === 'string' && shouldQuoteValue(key, value)) {
		return `"${formatted}"`
	}
	return formatted
}

function formatKeyLabel(key: string) {
	let keyPretty = key.charAt(0).toUpperCase() + key.slice(1).trim()
	keyPretty = keyPretty.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
	return keyPretty.replace(/\sor\s/gi, '/')
}

function singularizeLabel(label: string) {
	const normalized = label.trim()
	if (!normalized) {
		return 'Item'
	}
	if (/ies$/i.test(normalized)) {
		return normalized.replace(/ies$/i, 'y')
	}
	if (/ses$/i.test(normalized)) {
		return normalized.replace(/es$/i, '')
	}
	if (/s$/i.test(normalized)) {
		return normalized.replace(/s$/i, '')
	}
	return normalized
}

function flattenObject(obj: any, valueType: 'number' | 'percentage' | 'boolean' | 'bool' | 'raw', prefix?: string, suffix?: string): string {
	if (obj == null) {
		return ''
	}
	if (typeof obj !== 'object') {
		const bullet = prefix && prefix.length ? prefix : '- '
		return `${bullet}${formatValue(obj, valueType)}${suffix || ''}`.trim()
	}
	if (Array.isArray(obj)) {
		return obj
			.map(item => flattenObject(item, valueType, prefix, suffix))
			.filter(Boolean)
			.join('\n')
	}
	const lines: string[] = []
	for (const [key, value] of Object.entries(obj)) {
		if (value && typeof value === 'object' && !(value instanceof Date)) {
			const nested = flattenObject(value, valueType, prefix, suffix)
			if (nested) {
				lines.push(nested)
			}
		} else if (value != null && value !== '') {
			const bullet = prefix && prefix.length ? prefix : '- '
			lines.push(`${bullet}${formatKeyLabel(key)}: ${formatValue(value, valueType, key)}${suffix || ''}`)
		}
	}
	return lines.join('\n').trim()
}

function renderArraySection(
	collection: any[],
	valueType: 'number' | 'percentage' | 'boolean' | 'bool' | 'raw',
	prefix: string | undefined,
	suffix: string | undefined,
	maxDepth: number,
	defaultItemName: string,
	parentKey: string | undefined,
	level: number
): string {
	if (!Array.isArray(collection) || collection.length === 0) {
		return ''
	}
	const baseTag = singularizeLabel(formatKeyLabel(parentKey || defaultItemName))
	const tagName = level > 1 && parentKey?.toLowerCase() === 'channels' ? `Sub:${baseTag}` : baseTag
	return collection
		.map(item => {
			const body =
				typeof item === 'object'
					? convertRecursiveObjToStr(item, valueType, prefix, suffix, maxDepth, defaultItemName, parentKey, level + 1)
					: `${prefix || '- '}${formatValue(item, valueType)}${suffix || ''}`
			const content = body ? indentBlock(body) : ''
			return `<${tagName}>\n${content}\n</${tagName}>`
		})
		.join('\n\n')
}

function indentBlock(value: string, indent = '\t') {
	return value
		.split('\n')
		.map(line => `${indent}${line}`)
		.join('\n')
}

function shouldQuoteValue(key: string | undefined, value: string) {
	const normalized = value?.trim() ?? ''
	if (!normalized) {
		return false
	}
	const keyMatches = key ? ['content', 'contentstripped', 'bio', 'short_bio'].includes(key.toLowerCase()) : false
	return keyMatches || normalized.length > 30
}