import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-settings-billing`,
	title: `Billing`,
	parent: `Settings`,
	parents: [`Account`, `Settings`],
	icon: `fa-light fa-credit-card`,
	description: `View your billing information.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/settings/billing`,
		noindex: true,
	}
})
