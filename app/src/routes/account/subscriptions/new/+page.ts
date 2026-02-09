import { app } from '$lib/app'

export const load = () => ({
	slug: `account-subscriptions-new`,
	title: `New Subscription`,
	parent: `Subscriptions`,
	parents: [`Account`, `Billing`, `Subscriptions`],
	icon: `fa-light fa-plus`,
	description: `Choose a plan to subscribe to.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/subscriptions/new`,
		noindex: true,
	}
})
