import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `admin-commerce-subscriptions`,
	title: `Subscriptions`,
	parent: `Commerce`,
	parents: [`Admin`, `Commerce`],
	icon: `fa-light fa-repeat`,
	description: `Manage all subscriptions.`,
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/commerce/subscriptions`,
		noindex: true,
	}
})
