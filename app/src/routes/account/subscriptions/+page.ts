import { app } from '$lib/app'

export const load = () => ({
	slug: `account-subscriptions`,
	title: `Subscriptions`,
	parent: `Billing`,
	parents: [`Account`, `Billing`],
	icon: `fa-light fa-repeat`,
	description: `View and manage your subscriptions.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/subscriptions`,
		noindex: true,
	}
})
