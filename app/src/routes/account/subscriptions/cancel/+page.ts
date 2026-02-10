import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-subscriptions-cancel`,
	title: `Cancel Subscription`,
	parent: `Subscriptions`,
	parents: [`Account`, `Billing`, `Subscriptions`],
	icon: `fa-light fa-xmark`,
	description: `Confirm subscription cancellation.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/subscriptions/cancel`,
		noindex: true,
	}
})
