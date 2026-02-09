import { app } from '$lib/app'

export const load = () => ({
	slug: `admin-commerce-customers`,
	title: `Customers`,
	parent: `Commerce`,
	parents: [`Admin`, `Commerce`],
	icon: `fa-light fa-users`,
	description: `Manage billing customers.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/commerce/customers`,
		noindex: true,
	}
})
