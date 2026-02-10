import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-subscriptions-edit`,
	title: `Manage Subscription`,
	parent: `Subscriptions`,
	parents: [`Account`, `Billing`, `Subscriptions`],
	icon: `fa-light fa-pen-to-square`,
	description: `View and manage your subscription.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/subscriptions/edit`,
		noindex: true,
	}
})
