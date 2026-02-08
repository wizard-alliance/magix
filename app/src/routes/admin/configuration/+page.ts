import { app } from '$lib/app'

export const load = () => ({
	slug: `admin-configuration`,
	title: `Configuration`,
	parent: `Admin`,
	parents: [`Admin`],
	icon: `fa-light fa-cog`,
	description: `Manage system settings.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/configuration`,
		noindex: true,
	}
})
