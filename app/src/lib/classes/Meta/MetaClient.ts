import { writable, get } from 'svelte/store'
import { browser } from '$app/environment'
import {
	PUBLIC_APP_TARGET,
	PUBLIC_APP_URL,
	PUBLIC_API_URL,
	PUBLIC_APP_NAME,
	PUBLIC_APP_TAGLINE,
	PUBLIC_APP_DESCRIPTION,
	PUBLIC_APP_COLOR,
	PUBLIC_APP_VERSION,
} from '$env/static/public'

import { Navigations } from './Navigations'

import type { Writable } from 'svelte/store'
import type { AppMeta, PageMeta, PageLoadData, ConfigResponse, ConfigPermission, ConfigProduct } from '$lib/types/meta'

const defaultPage: PageMeta = {
	slug: ``,
	title: `Loading...`,
	titleFull: `Loading...`,
	parent: ``,
	parents: [],
	icon: `fa-light fa-spinner`,
	description: ``,
	sidebars: { 0: true, 1: true, 2: false },
	nav: null,
	seo: {},
}

export class MetaClient {
	private readonly prefix = `MetaClient`
	private dbLoaded = false
	ready: Promise<void> = Promise.resolve()

	// Call once after RequestClient exists — starts DB fetch on client
	init() {
		if (browser) this.ready = this.loadFromDB()
	}

	// Static app-level branding + infra — immutable after init, SSR-safe
	app: AppMeta = {
		name: PUBLIC_APP_NAME || `App`,
		tagline: PUBLIC_APP_TAGLINE || ``,
		description: PUBLIC_APP_DESCRIPTION || ``,
		version: PUBLIC_APP_VERSION || `1.0.0`,
		color: PUBLIC_APP_COLOR || `#813ece`,
		titleSeparator: ` | `,
		colorSecondary: ``,
		logo: ``,
		ogImage: ``,
		url: PUBLIC_APP_URL || ``,
		runtime: (PUBLIC_APP_TARGET === 'electron' ? 'electron' : 'web') as AppMeta['runtime'],
		apiBaseUrl: PUBLIC_APP_TARGET !== 'electron'
			? (PUBLIC_API_URL || `http://localhost:4000/api/v1`)
			: `/api/v1`,
	}

	// Global config data — populated from GET /config
	permissions: ConfigPermission[] = []
	products: ConfigProduct[] = []

	// Per-page meta — writable store, always up to date
	page: Writable<PageMeta> = writable({ ...defaultPage })

	// Navigation sub-system
	navigations = new Navigations()

	// Called by layout on every navigation — bridges SvelteKit $page.data → Meta store
	// Layering: .env → page.ts → DB (if loaded)
	setPage = (data: Partial<PageLoadData>) => {
		if (!data || !data.slug) return

		const title = data.title || `Loading...`
		const parent = data.parent || ``
		const parents = data.parents || []

		const merged: PageMeta = {
			slug: data.slug,
			title,
			titleFull: this.buildTitle(title, parent),
			parent,
			parents,
			icon: data.icon || `fa-light fa-file`,
			description: data.description || ``,
			sidebars: data.sidebars || { 0: true, 1: true, 2: false },
			nav: data.nav || null,
			seo: { ...data.seo },
		}

		this.page.set(merged)

		if (browser && typeof app !== `undefined` && app.UI?.applySidebarConfig) {
			app.UI.applySidebarConfig(merged.sidebars)
		}
	}

	// Fetch global config (settings, permissions, products, providers)
	// Settings: _ prefix = boolean, numeric strings = number, rest = string
	async loadFromDB() {
		if (this.dbLoaded === true) return

		try {
			const cached = app.Cache.get<ConfigResponse>(`config`)
			const data = cached ?? await app.System.Request.get<ConfigResponse>(`/config`, { useAuth: false })

			if (!data) return

			// Settings → merge into app branding object
			for (const { key: rawKey, value: rawValue } of data.settings || []) {
				if (!rawKey) continue
				if (rawKey.startsWith(`_`)) {
					this.app[rawKey.slice(1)] = rawValue === `1` || rawValue?.toLowerCase() === `true`
					continue
				}
				this.app[rawKey] = this.coerceValue(rawValue)
			}

			this.permissions = data.permissions || []
			this.products = data.products || []

			if (!cached) app.Cache.set(`config`, data)
			this.dbLoaded = true
		} catch (error) {
			console.warn(`${this.prefix}: failed to load config`, error)
		}
	}

	// Coerce a raw string value to number if numeric, otherwise string
	private coerceValue(raw: string | null): string | number {
		if (raw === null || raw === ``) return ``
		const num = Number(raw)
		return !isNaN(num) && raw.trim() !== `` ? num : raw
	}

	isDBLoaded = () => this.dbLoaded

	// Force re-fetch config from API
	async reload() {
		this.dbLoaded = false
		app.Cache.clear(`config`)
		await this.loadFromDB()
	}

	// Svelte store contract
	subscribe(run: (value: PageMeta) => void) {
		return this.page.subscribe(run)
	}

	getPage = () => get(this.page)
	getPermissions = () => this.permissions
	getProducts = () => this.products

	// Build the full page title: [appName] [sep] [parent] / [title]
	buildTitle = (title: string, parent?: string): string => {
		const sep = this.app.titleSeparator
		const prefix = parent ? `${parent} → ${title}` : title
		return `${prefix}${sep}${this.app.name}`
	}
}
