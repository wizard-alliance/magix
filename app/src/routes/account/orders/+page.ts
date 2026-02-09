import { app } from '$lib/app'

export const load = () => ({
	slug: `account-orders`,
	title: `Orders`,
	parent: `Billing`,
	parents: [`Account`, `Billing`],
	icon: `fa-light fa-shopping-cart`,
	description: `View your order history.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/orders`,
		noindex: true,
	}
})
