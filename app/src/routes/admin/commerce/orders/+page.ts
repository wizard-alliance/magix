import { app } from '$lib/app'

export const load = () => ({
	slug: `admin-commerce-orders`,
	title: `Orders`,
	parent: `Commerce`,
	parents: [`Admin`, `Commerce`],
	icon: `fa-light fa-shopping-cart`,
	description: `Manage all orders.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/commerce/orders`,
		noindex: true,
	}
})
