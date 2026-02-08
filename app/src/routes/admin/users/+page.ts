import { app } from '$lib/app'

export const load = () => ({
	slug: `admin-users`,
	title: `Users`,
	parent: `Admin`,
	parents: [`Admin`],
	icon: `fa-light fa-users-crown`,
	description: `Manage system users.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/users`,
		noindex: true,
	}
})
