import languages from '@shared/languages.json' with { type: 'json' }

export type Language = {
	id: number
	slug: string
	name: string
	localName: string
	code: string
}

const data: Language[] = languages as Language[]

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

	get(query: string | number): Language | undefined {
		if (typeof query === `number`) return byId.get(query)
		if (query.length === 2) return bySlug.get(query.toLowerCase())
		return byName.get(query.toLowerCase())
	}

	getMany(): Language[] {
		return data
	}

	options(): { label: string, value: string }[] {
		return data.map(l => ({ label: l.name, value: l.slug }))
	}
}
