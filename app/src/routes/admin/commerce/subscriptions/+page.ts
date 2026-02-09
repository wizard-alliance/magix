import { app } from '$lib/app'

export const load = () => ({
	slug: `admin-commerce-subscriptions`,
	title: `Subscriptions`,
	parent: `Commerce`,
	parents: [`Admin`, `Commerce`],
	icon: `fa-light fa-repeat`,
	description: `Manage all subscriptions.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/commerce/subscriptions`,
		noindex: true,
	}
})
