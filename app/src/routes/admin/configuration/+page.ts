import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `admin-configuration`,
	title: `Configuration`,
	parent: `Admin`,
	parents: [`Admin`],
	icon: `fa-light fa-cog`,
	description: `Manage system settings.`,
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/configuration`,
		noindex: true,
	}
})
