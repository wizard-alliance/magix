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

import { navigationData, getNavigationData } from '$configs/nav'

import type { Writable } from 'svelte/store'
import type { AppMeta, PageMeta, PageLoadData, NavigationsConfig, DropdownItem } from '$lib/types/meta'
import type { NavigationLink } from '$lib/types/types'

const defaultPage: PageMeta = {
	slug: ``,
	title: `Loading...`,
	icon: `fa-light fa-spinner`,
	description: ``,
	sidebars: { 0: true, 1: true, 2: false },
	nav: null,
	seo: {},
}

export class MetaClient {
	private readonly prefix = `MetaClient`

	// Static app-level branding + infra — immutable after init, SSR-safe
	app: AppMeta = {
		name: PUBLIC_APP_NAME || `App`,
		tagline: PUBLIC_APP_TAGLINE || ``,
		description: PUBLIC_APP_DESCRIPTION || ``,
		version: PUBLIC_APP_VERSION || `1.0.0`,
		color: PUBLIC_APP_COLOR || `#813ece`,
		colorSecondary: ``,
		logo: ``,
		ogImage: ``,
		url: PUBLIC_APP_URL || ``,
		runtime: (PUBLIC_APP_TARGET === 'electron' ? 'electron' : 'web') as AppMeta['runtime'],
		apiBaseUrl: PUBLIC_APP_TARGET !== 'electron'
			? (PUBLIC_API_URL || `http://localhost:4000/api/v1`)
			: `/api/v1`,
	}

	// Per-page meta — client-only writable store
	page: Writable<PageMeta> = writable({ ...defaultPage })

	// Navigation sub-system
	navigations: NavigationsConfig = {
		tree: navigationData,
		links: [
			{ label: `Home`, href: `/home` },
		] as NavigationLink[],
		userMenu: {
			loggedIn: [
				{ label: `Profile`, href: `/account/profile` },
				{ label: `Settings`, href: `/account/settings` },
				{ label: `Logout`, href: `/auth/logout` },
			],
			loggedOut: [
				{ label: `Login`, href: `/auth/login` },
				{ label: `Register`, href: `/auth/register` },
			],
		},
		get: (slug: string) => getNavigationData(slug),
		list: () => this.navigations.links,
		getMenu: (isLoggedIn: boolean) =>
			isLoggedIn ? this.navigations.userMenu.loggedIn : this.navigations.userMenu.loggedOut,
	}

	// Computed full title: "AppName - PageTitle"
	titleFull = (pageTitle?: string) => {
		const current = get(this.page)
		return `${this.app.name} - ${pageTitle || current.title || `Loading...`}`
	}

	// Called by layout on every navigation — bridges SvelteKit $page.data → Meta store
	setPage = (data: Partial<PageLoadData>) => {
		if (!data || !data.slug) return

		const merged: PageMeta = {
			slug: data.slug || ``,
			title: data.title || `Loading...`,
			icon: data.icon || `fa-light fa-file`,
			description: data.description || ``,
			sidebars: data.sidebars || { 0: true, 1: true, 2: false },
			nav: data.nav || null,
			seo: data.seo || {},
		}

		this.page.set(merged)

		// Apply sidebar config (UIManager must be instantiated before MetaClient)
		if (browser && typeof app !== 'undefined' && app.UI?.applySidebarConfig) {
			app.UI.applySidebarConfig(merged.sidebars)
		}
	}

	// Future: overlay DB-fetched meta onto page store by slug
	// async loadFromDB(slug: string) {
	// 	const dbMeta = await app.System.Request.get(`/meta/${slug}`)
	// 	if (dbMeta) this.setPage({ ...get(this.page), ...dbMeta })
	// }

	// Svelte store contract — allows $app.Meta.page syntax if needed
	subscribe(run: (value: PageMeta) => void) {
		return this.page.subscribe(run)
	}

	getPage = () => get(this.page)
}
