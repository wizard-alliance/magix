// Nav tree item (used in sidebar page-nav and global nav config)
export type NavItem = {
	slug: string
	label: string
	href: string | null
	target: string
	icon: string
	permissions: string[]
	classes: string
	align: string | null
	children?: NavItem[]
}

export type DropdownItem = {
	label: string
	href?: string
	action?: string
}

export type UserMenuConfig = {
	loggedIn: DropdownItem[]
	loggedOut: DropdownItem[]
}

// SEO sub-shape per page
export type SeoMeta = {
	canonical?: string
	noindex?: boolean
	robots?: string
	ogTitle?: string
	ogDescription?: string
	ogImage?: string
	twitterCard?: 'summary' | 'summary_large_image' | 'player'
	locale?: string
}

// Sidebar visibility config per page
export type SidebarConfig = {
	0: boolean
	1: boolean
	2: boolean
}

// What every +page.ts load() must return
export type PageLoadData = {
	slug: string
	title: string
	parent?: string
	parents?: string[]
	icon: string
	description: string
	sidebars: SidebarConfig
	nav: NavItem[] | null
	seo: SeoMeta
	[key: string]: unknown
}

// Current page meta (derived from PageLoadData + enrichment)
export type PageMeta = {
	slug: string
	title: string
	titleFull: string
	parent: string
	parents: string[]
	icon: string
	description: string
	sidebars: SidebarConfig
	nav: NavItem[] | null
	seo: SeoMeta
}

// Static app-level branding + infra
export type AppMeta = {
	name: string
	tagline: string
	description: string
	version: string
	titleSeparator: string
	color: string
	colorSecondary: string
	logo: string
	ogImage: string
	url: string
	runtime: 'web' | 'electron'
	apiBaseUrl: string
	[key: string]: string | number | boolean
}

