import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-subscriptions`,
	title: `Subscriptions`,
	parent: `Billing`,
	parents: [`Account`, `Billing`],
	icon: `fa-light fa-repeat`,
	description: `View and manage your subscriptions.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/subscriptions`,
		noindex: true,
	}
})
