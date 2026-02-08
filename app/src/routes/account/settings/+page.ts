import { app } from '$lib/app'

export const load = () => ({
	slug: `account-settings`,
	title: `Preferences`,
	icon: `fa-light fa-sliders`,
	description: `Manage your account preferences.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/settings`,
		noindex: true,
	}
})
