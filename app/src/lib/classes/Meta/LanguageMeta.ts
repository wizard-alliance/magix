import languages from '$shared/languages.json'

import type { Language } from '$lib/types/meta'

const data: Language[] = languages as Language[]

// Lookup maps for fast access by slug, id, and name
const bySlug = new Map<string, Language>()
const byId = new Map<number, Language>()
const byName = new Map<string, Language>()

for (const l of data) {
	bySlug.set(l.slug, l)
	byId.set(l.id, l)
	byName.set(l.name.toLowerCase(), l)
}

export class LanguageMeta {
	private readonly prefix = `LanguageMeta`

	// Get a single language by slug (e.g. "en"), id, or name
	get(query: string | number): Language | undefined {
		if (typeof query === `number`) return byId.get(query)
		if (query.length === 2) return bySlug.get(query.toLowerCase())
		return byName.get(query.toLowerCase())
	}

	// Get all languages
	getMany(): Language[] {
		return data
	}

	// Get select-compatible options: { label, value }
	options(): { label: string, value: string }[] {
		return data.map(l => ({ label: l.name, value: l.slug }))
	}
}
