import { app } from '$lib/app'

export const load = () => ({
	slug: `account-subscriptions-edit`,
	title: `Manage Subscription`,
	parent: `Subscriptions`,
	parents: [`Account`, `Billing`, `Subscriptions`],
	icon: `fa-light fa-pen-to-square`,
	description: `View and manage your subscription.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/subscriptions/edit`,
		noindex: true,
	}
})
