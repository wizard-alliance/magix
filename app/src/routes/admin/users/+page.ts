import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `admin-users`,
	title: `Users`,
	parent: `Admin`,
	parents: [`Admin`],
	icon: `fa-light fa-users-crown`,
	description: `Manage system users.`,
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/users`,
		noindex: true,
	}
})
