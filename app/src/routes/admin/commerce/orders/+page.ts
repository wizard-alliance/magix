import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `admin-commerce-orders`,
	title: `Orders`,
	parent: `Commerce`,
	parents: [`Admin`, `Commerce`],
	icon: `fa-light fa-shopping-cart`,
	description: `Manage all orders.`,
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/commerce/orders`,
		noindex: true,
	}
})
