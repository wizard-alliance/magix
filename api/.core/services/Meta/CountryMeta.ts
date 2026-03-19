import countries from '@shared/countries.json' with { type: 'json' }

export type Country = {
	id: number
	name: string
	slug: string
	code: string
	localName: string
	phoneCode: string
}

const data: Country[] = countries as Country[]

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

	get(query: string | number): Country | undefined {
		if (typeof query === `number`) return byId.get(query)
		if (query.length === 2) return bySlug.get(query.toUpperCase())
		return byName.get(query.toLowerCase())
	}

	getMany(): Country[] {
		return data
	}

	options(): { label: string, value: string }[] {
		return data.map(c => ({ label: c.name, value: c.slug }))
	}
}
