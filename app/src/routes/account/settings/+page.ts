import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-settings`,
	title: `Preferences`,
	parent: `Account`,
	parents: [`Account`],
	icon: `fa-light fa-sliders`,
	description: `Manage your account preferences.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/settings`,
		noindex: true,
	}
})
