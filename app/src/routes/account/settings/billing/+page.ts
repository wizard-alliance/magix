import { app } from '$lib/app'

export const load = () => ({
	slug: `account-settings-billing`,
	title: `Billing`,
	parent: `Settings`,
	parents: [`Account`, `Settings`],
	icon: `fa-light fa-credit-card`,
	description: `View your billing information.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/settings/billing`,
		noindex: true,
	}
})
