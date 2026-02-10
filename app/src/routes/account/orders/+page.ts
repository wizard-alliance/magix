import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-orders`,
	title: `Orders`,
	parent: `Billing`,
	parents: [`Account`, `Billing`],
	icon: `fa-light fa-shopping-cart`,
	description: `View your order history.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/orders`,
		noindex: true,
	}
})
