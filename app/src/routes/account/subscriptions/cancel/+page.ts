import { app } from '$lib/app'

export const load = () => ({
	slug: `account-subscriptions-cancel`,
	title: `Cancel Subscription`,
	parent: `Subscriptions`,
	parents: [`Account`, `Billing`, `Subscriptions`],
	icon: `fa-light fa-xmark`,
	description: `Confirm subscription cancellation.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/subscriptions/cancel`,
		noindex: true,
	}
})
