import countries from '$shared/countries.json'

import type { Country } from '$lib/types/meta'

const data: Country[] = countries as Country[]

// Lookup maps for fast access by slug, id, and name
const bySlug = new Map<string, Country>()
const byId = new Map<number, Country>()
const byName = new Map<string, Country>()

for (const c of data) {
	bySlug.set(c.slug, c)
	byId.set(c.id, c)
	byName.set(c.name.toLowerCase(), c)
}

export class CountryMeta {
	private readonly prefix = `CountryMeta`

	// Get a single country by slug (e.g. "NO"), id, or name
	get(query: string | number): Country | undefined {
		if (typeof query === `number`) return byId.get(query)
		if (query.length === 2) return bySlug.get(query.toUpperCase())
		return byName.get(query.toLowerCase())
	}

	// Get all countries
	getMany(): Country[] {
		return data
	}

	// Get select-compatible options: { label, value }
	options(): { label: string, value: string }[] {
		return data.map(c => ({ label: c.name, value: c.slug }))
	}
}
